import re
import warnings
import logging
from flask import Flask, request, send_file, jsonify, make_response
from flask_cors import CORS
from io import BytesIO
import json
import torch
from torch import no_grad, LongTensor
import soundfile as sf
import traceback
import commons
import utils
from models import SynthesizerTrn
from text import text_to_sequence
import multiprocessing
import os
import signal
import sys
from pykakasi import kakasi
from hangulize import hangulize
import eng_to_ipa
from transformers import BartTokenizer, BartForConditionalGeneration
from concurrent.futures import ThreadPoolExecutor

# 특정 경고 무시
warnings.filterwarnings("ignore", category=UserWarning, message="torch.nn.utils.weight_norm is deprecated in favor of torch.nn.utils.parametrizations.weight_norm.")

# 로그 설정
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/tts/*": {"origins": ["https://holovrm.com", "https://www.holovrm.com"]}}, supports_credentials=True)

device = 'cuda' if torch.cuda.is_available() else 'cpu'

# 일본어 한자 -> 히라가나 변환을 위해 pykakasi 사용
kakasi = kakasi()
kakasi.setMode("J", "H")  # 한자를 히라가나로 변환하도록 설정
kakasi.setMode("K", "H")  # 카타카나를 히라가나로 변환하도록 설정
converter = kakasi.getConverter()

# IPA -> 한글 발음 모델 및 토크나이저 초기화 (필요한 경우에만 로드)
model_path = "./best_model"
tokenizer = BartTokenizer.from_pretrained('facebook/bart-base')
ipa_model = None  # 영어가 포함된 경우에만 모델 로드

# 히라가나 -> 한국어 발음 변환 함수
def japanese_to_korean_pronunciation(hiragana_text):
    return hangulize(hiragana_text, 'jpn')

# 영어 텍스트를 IPA로 변환 후 한글 발음으로 변환하는 함수 (배치 처리)
def english_to_korean_pronunciation_batch(english_texts):
    global ipa_model
    if ipa_model is None:  # 첫 호출 시 모델 로드
        ipa_model = BartForConditionalGeneration.from_pretrained(model_path).to(device)
    
    # 영어 텍스트를 IPA로 변환
    ipa_texts = [eng_to_ipa.convert(text) for text in english_texts]
    inputs = tokenizer(ipa_texts, return_tensors="pt", padding=True, truncation=True).to(device)
    
    with no_grad():
        outputs = ipa_model.generate(inputs['input_ids'], max_length=50, num_beams=5, early_stopping=True)
    results = [tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
    
    # 메모리 해제
    del inputs, outputs
    if device == 'cuda':
        torch.cuda.empty_cache()
    
    return results

# 한국어와 일본어가 섞인 문장을 처리하는 함수 (영어가 포함된 경우 IPA 변환)
def process_mixed_text(input_text):
    input_text = input_text.replace('、', ',').replace('。', '.').replace('！', '!').replace('？', '?')
    
    word_pattern = r'[a-zA-Z]+|[぀-ヿ一-鿿]+|[^぀-ヿ一-鿿a-zA-Z\s]+'
    words = re.findall(word_pattern, input_text)
    
    # 영어 단어와 그 인덱스를 분리하여 저장
    english_words = []
    english_indices = []
    for idx, word in enumerate(words):
        if re.match(r'[a-zA-Z]+', word):
            english_words.append(word)
            english_indices.append(idx)
    
    # 배치로 영어 -> IPA -> 한글 발음 변환 (병렬 처리 추가)
    if english_words:
        with ThreadPoolExecutor() as executor:
            batch_size = 10  # 한 번에 처리할 단어 수
            futures = []
            for i in range(0, len(english_words), batch_size):
                batch = english_words[i:i + batch_size]
                futures.append(executor.submit(english_to_korean_pronunciation_batch, batch))
            
            korean_pronunciations = []
            for future in futures:
                korean_pronunciations.extend(future.result())
        
        for i, idx in enumerate(english_indices):
            words[idx] = korean_pronunciations[i]
    
    # 일본어 단어 변환
    for idx, word in enumerate(words):
        if re.match(r'[぀-ヿ一-鿿]+', word):
            hiragana_text = converter.do(word)
            korean_pronunciation = japanese_to_korean_pronunciation(hiragana_text)
            words[idx] = korean_pronunciation
    
    result_text = ' '.join(words)
    logging.debug(f"Processed text: {result_text}")
    print(f"Processed text: {result_text}")
    return result_text

# 텍스트를 TTS로 변환하는 함수
def get_text(text, hps, is_phoneme):
    text_norm = text_to_sequence(text, hps.symbols, [] if is_phoneme else hps.data.text_cleaners)
    if hps.data.add_blank:
        text_norm = commons.intersperse(text_norm, 0)
    text_norm = LongTensor(text_norm).to(device)
    return text_norm

# 모델 로드 함수
def load_model(config_path, model_path):
    with open(config_path, "r", encoding='utf-8') as f:
        hps = utils.HParams(**json.load(f))

    net_g = SynthesizerTrn(
        len(hps.symbols),
        hps.data.filter_length // 2 + 1,
        hps.train.segment_size // hps.data.hop_length,
        **hps.model).to(device)
    _ = net_g.eval()

    utils.load_checkpoint(model_path, net_g, None)
    return net_g, hps

# TTS 처리 함수
def tts(model, hps, text, speaker_id, speed=1.0, is_phoneme=False):
    processed_text = process_mixed_text(text)
    stn_tst = get_text(processed_text, hps, is_phoneme)
    try:
        with no_grad():
            x_tst = stn_tst.unsqueeze(0)
            x_tst_lengths = LongTensor([stn_tst.size(0)]).to(device)
            sid = LongTensor([speaker_id]).to(device)
            audio = model.infer(x_tst, x_tst_lengths, sid=sid, noise_scale=.667, noise_scale_w=0.8,
                                length_scale=1.0 / speed)[0][0, 0].data.cpu().float().numpy()
    except torch.cuda.OutOfMemoryError:
        logging.error("CUDA out of memory. Aborting operation.")
        if device == 'cuda':
            torch.cuda.empty_cache()
        raise RuntimeError("CUDA out of memory. The operation was aborted to prevent further issues.")

    del stn_tst, x_tst, x_tst_lengths, sid
    if device == 'cuda':
        torch.cuda.empty_cache()
    return hps.data.sampling_rate, audio

# TTS API 엔드포인트
@app.route('/tts', methods=['POST'])
def tts_endpoint():
    data = request.json
    text = data.get('text', '')
    character = data.get('character', '')
    logging.debug(f"Received request: text={text}, character={character}")
    print(f"Received request: text={text}, character={character}")

    if not text or not character:
        logging.error("Text or character not provided")
        return jsonify({"error": "Text or character not provided"}), 400
    
    try:
        config_path = f"saved_model/{character}/config.json"
        model_path = f"saved_model/{character}/model.pth"
        logging.debug(f"Loading model from {config_path} and {model_path}")
        speaker_id = 0

        model, hps = load_model(config_path, model_path)
        logging.debug("Model loaded successfully")
        sampling_rate, audio = tts(model, hps, text, speaker_id)
        logging.debug("TTS conversion successful")
        
        output = BytesIO()
        sf.write(output, audio, sampling_rate, format='WAV')
        output.seek(0)
        
        response = make_response(send_file(output, mimetype='audio/wav'))
        
        # 응답 전송 후 프로세스 종료
        os.kill(os.getpid(), signal.SIGTERM)
        
        return response
    except RuntimeError as e:
        if "CUDA out of memory" in str(e):
            return jsonify({"error": "CUDA out of memory. Operation aborted."}), 500
        else:
            logging.error("Runtime error occurred", exc_info=True)
            return jsonify({"error": str(e), "detail": traceback.format_exc()}), 500
    except Exception as e:
        logging.error("Error occurred", exc_info=True)
        return jsonify({"error": str(e), "detail": traceback.format_exc()}), 500

# Flask 앱 시작 함수
def start_flask_app():
    app.run(host="0.0.0.0", port=3545, debug=False)

if __name__ == "__main__":
    multiprocessing.set_start_method('spawn')
    while True:
        process = multiprocessing.Process(target=start_flask_app)
        process.start()
        process.join()



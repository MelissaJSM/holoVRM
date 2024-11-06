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

# 히라가나 -> 한국어 발음 변환을 위해 hangulize 사용
def japanese_to_korean_pronunciation(hiragana_text):
    return hangulize(hiragana_text, 'jpn')

# 한국어와 일본어가 섞인 문장을 처리하는 함수 (단어별로 변환하여 띄어쓰기를 유지)
def process_mixed_text(input_text):
    # 일본어 특수문자 、 。를 일반적인 , .로 변경
    input_text = input_text.replace('、', ',').replace('。', '.').replace('！', '!').replace('？', '?')
    
    # 정규식을 사용하여 일본어(한자, 히라가나, 카타카나) 또는 비일본어 단어로 분리
    word_pattern = r'[぀-ヿ一-鿿]+|[^぀-ヿ一-鿿\s]+'
    words = re.findall(word_pattern, input_text)
    
    processed_words = []
    for word in words:
        if re.match(r'[぀-ヿ一-鿿]+', word):
            # 일본어인 경우 변환 수행
            hiragana_text = converter.do(word)
            korean_pronunciation = japanese_to_korean_pronunciation(hiragana_text)
            processed_words.append(korean_pronunciation)
        else:
            # 일본어가 아닌 경우 그대로 추가
            processed_words.append(word)
    
    # 단어들을 공백으로 연결하여 최종 문장 구성
    result_text = ' '.join(processed_words)
    logging.debug(f"Processed text: {result_text}")
    print(f"Processed text: {result_text}")
    return result_text

def get_text(text, hps, is_phoneme):
    text_norm = text_to_sequence(text, hps.symbols, [] if is_phoneme else hps.data.text_cleaners)
    if hps.data.add_blank:
        text_norm = commons.intersperse(text_norm, 0)
    text_norm = LongTensor(text_norm).to(device)
    return text_norm

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

def tts(model, hps, text, speaker_id, speed=1.0, is_phoneme=False):
    # 한국어와 일본어가 섞여 있는 경우 일본어 부분을 변환
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

    # 메모리 해제
    del stn_tst, x_tst, x_tst_lengths, sid
    if device == 'cuda':
        torch.cuda.empty_cache()
    return hps.data.sampling_rate, audio

@app.route('/tts', methods=['POST'])
def tts_endpoint():
    data = request.json
    text = data.get('text', '')
    character = data.get('character', '')
    logging.debug(f"Received request: text={text}, character={character}")
    print(f"Received request: text={text}, character={character}")
    logging.debug(f"Received request: text={text}, character={character}")
    if not text or not character:
        logging.error("Text or character not provided")
        return jsonify({"error": "Text or character not provided"}), 400
    
    try:
        config_path = f"saved_model/{character}/config.json"
        model_path = f"saved_model/{character}/model.pth"
        logging.debug(f"Loading model from {config_path} and {model_path}")
        speaker_id = 0  # 모델의 올바른 화자 ID로 변경

        model, hps = load_model(config_path, model_path)
        logging.debug("Model loaded successfully")
        sampling_rate, audio = tts(model, hps, text, speaker_id)
        logging.debug("TTS conversion successful")
        
        output = BytesIO()
        sf.write(output, audio, sampling_rate, format='WAV')
        output.seek(0)
        
        response = make_response(send_file(output, mimetype='audio/wav'))
        
        # 작업이 끝나면 프로세스를 종료
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

def start_flask_app():
    app.run(host="0.0.0.0", port=3545, debug=False)

if __name__ == "__main__":
    multiprocessing.set_start_method('spawn')
    while True:
        process = multiprocessing.Process(target=start_flask_app)
        process.start()
        process.join()  # 프로세스가 종료될 때까지 대기


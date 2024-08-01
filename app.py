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

# 특정 경고 무시
warnings.filterwarnings("ignore", category=UserWarning, message="torch.nn.utils.weight_norm is deprecated in favor of torch.nn.utils.parametrizations.weight_norm.")

# 로그 설정
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/tts/*": {"origins": ["https://holovrm.com", "https://www.holovrm.com"]}}, supports_credentials=True)

device = 'cuda' if torch.cuda.is_available() else 'cpu'
# print(f"Using device: {device}")

def get_text(text, hps, is_phoneme):
    text_norm = text_to_sequence(text, hps.symbols, [] if is_phoneme else hps.data.text_cleaners)
    if hps.data.add_blank:
        text_norm = commons.intersperse(text_norm, 0)
    text_norm = LongTensor(text_norm).to(device)
    #print(f"Text normalized: {text_norm}")
    return text_norm

def load_model(config_path, model_path):
    #print(f"Loading model config from {config_path} and weights from {model_path}")
    with open(config_path, "r", encoding='utf-8') as f:
        hps = utils.HParams(**json.load(f))
        #print(f"Model config loaded: {hps}")

    net_g = SynthesizerTrn(
        len(hps.symbols),
        hps.data.filter_length // 2 + 1,
        hps.train.segment_size // hps.data.hop_length,
        **hps.model).to(device)
    _ = net_g.eval()
    #print("Model initialized")

    utils.load_checkpoint(model_path, net_g, None)
    #print("Model weights loaded")
    return net_g, hps

def tts(model, hps, text, speaker_id, speed=1.0, is_phoneme=False):
    stn_tst = get_text(text, hps, is_phoneme)
    with no_grad():
        x_tst = stn_tst.unsqueeze(0)
        x_tst_lengths = LongTensor([stn_tst.size(0)]).to(device)
        sid = LongTensor([speaker_id]).to(device)
        #print(f"Inputs prepared: x_tst={x_tst}, x_tst_lengths={x_tst_lengths}, sid={sid}")
        audio = model.infer(x_tst, x_tst_lengths, sid=sid, noise_scale=.667, noise_scale_w=0.8,
                            length_scale=1.0 / speed)[0][0, 0].data.cpu().float().numpy()
        #print(f"Audio generated: {audio[:10]}...")  # 첫 10개의 오디오 샘플 출력

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
    if not text or not character:
        logging.error("Text or character not provided")
        #print("Error: Text or character not provided")
        return jsonify({"error": "Text or character not provided"}), 400
    
    try:
        config_path = f"saved_model/{character}/config.json"
        model_path = f"saved_model/{character}/model.pth"
        logging.debug(f"Loading model from {config_path} and {model_path}")
        #print(f"Loading model from {config_path} and {model_path}")
        speaker_id = 0  # 모델의 올바른 화자 ID로 변경

        model, hps = load_model(config_path, model_path)
        logging.debug("Model loaded successfully")
        #print("Model loaded successfully")
        sampling_rate, audio = tts(model, hps, text, speaker_id)
        logging.debug("TTS conversion successful")
        print("TTS conversion successful")
        
        output = BytesIO()
        sf.write(output, audio, sampling_rate, format='WAV')
        output.seek(0)
        #print("Audio file prepared for response")
        
        response = make_response(send_file(output, mimetype='audio/wav'))
        
        # 작업이 끝나면 프로세스를 종료
        os.kill(os.getpid(), signal.SIGTERM)
        
        return response
    except Exception as e:
        logging.error("Error occurred", exc_info=True)
        #print(f"Error occurred: {e}")
        #print(traceback.format_exc())
        return jsonify({"error": str(e), "detail": traceback.format_exc()}), 500

def start_flask_app():
    app.run(host="0.0.0.0", port=3545, debug=False)

if __name__ == "__main__":
    multiprocessing.set_start_method('spawn')
    while True:
        process = multiprocessing.Process(target=start_flask_app)
        process.start()
        process.join()  # 프로세스가 종료될 때까지 대기


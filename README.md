# TTS SERVER

해당 TTS 서버가 있어야 TTS 통신이 가능합니다.  
모델 파일은 VITS 파일을 가지고 하시면 됩니다.

## 사용 방법
1. 파이썬을 설치합니다.
2. `requirements.txt`를 설치합니다.
3. vits tts 모델을 찾습니다.
4. `save_models` 폴더에 캐릭터명으로 폴더를 만듭니다.
5. 폴더 안에 json 파일은 `config.json`, pth 파일은 `model.pth`로 변경합니다.
6. 현재 gunicorn을 이용하였으나, 사용자의 취향대로 `app.py`를 구동시킵니다.

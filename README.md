# TTS SERVER

해당 TTS 서버가 있어야 TTS 통신이 가능합니다.  
모델 파일은 VITS 파일을 가지고 하시면 됩니다.

## 사용 방법
1. 파이썬을 설치합니다.
2. `requirements.txt`를 설치합니다.
3. vits tts 모델을 찾습니다.
4. `save_models` 폴더에 캐릭터명으로 폴더를 만듭니다.
5. 폴더 안에 json 파일은 `config.json`, pth 파일은 `model.pth`로 변경합니다.
6. 현재 gunicorn을 이용하였으나, 사용자의 취향대로 `app.py | app_jpn.py | app_kor.py`를 구동시킵니다.

# 버전 안내
1. app_jpn.py : 한국어와 일본어 대응
2. app.py : 한국어와 일본어 영어 대응(딥러닝 파일 필요)
3. app_kor.py : 한국어만 가능

# 영어 구동 방법
1. https://github.com/MelissaJSM/IpaToKorean 링크로 들어갑니다.
2. 딥러닝을 학습시킨 파일을 tts 폴더내에 best_model 폴더를 생성 후 넣습니다.
3. 이후 코드 app.py를 동작시키면 됩니다.

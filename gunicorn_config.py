# gunicorn_config.py

workers = 5  # CPU 코어 수에 맞춰 워커 수를 설정합니다
threads = 2  # 각 워커당 2개의 쓰레드를 사용합니다
timeout = 120  # 타임아웃을 120초로 설정합니다
bind = "0.0.0.0:3545"  # 호스트와 포트를 지정합니다


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import QRCode from 'qrcode';

const SetupOtp = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [, setOtpSecret] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [serverTime, setServerTime] = useState('');
    const [clientTime, setClientTime] = useState('');
    const router = useRouter();
    const userId = "admin"; // ID를 자동으로 "admin"으로 설정

    useEffect(() => {
        const checkOtpSecret = async () => {
            try {
                const response = await fetch('/api/check-otp-secret', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                });

                const data = await response.json();
                if (data.exists) {
                    router.push('/'); // 조건이 만족되면 다른 페이지로 리다이렉트
                }
            } catch (error) {
                console.error('OTP 시크릿 확인 중 오류가 발생했습니다.', error);
                setError('OTP 시크릿 확인 중 오류가 발생했습니다.');
            }
        };

        checkOtpSecret();

        const fetchOtpSecret = async () => {
            try {
                const response = await fetch('/api/setup-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                });

                const data = await response.json();
                setOtpSecret(data.secret);
                const otpAuthUrl = `otpauth://totp/Admin?secret=${data.secret}&issuer=HoloVRM`;
                const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
                setQrCodeUrl(qrCodeDataUrl);

                // 서버 시간 가져오기
                const serverTimeResponse = await fetch('/api/server-time');
                const serverTimeData = await serverTimeResponse.json();
                setServerTime(serverTimeData.serverTime);
            } catch (error) {
                console.error('OTP 시크릿을 가져오는 중 오류가 발생했습니다.', error);
                setError('OTP 시크릿을 가져오는 중 오류가 발생했습니다.');
            }
        };

        fetchOtpSecret();

        // 클라이언트 시간 업데이트
        const intervalId = setInterval(() => {
            const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            setClientTime(currentTime);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, password, otp }),
            });

            const data = await response.json();
            if (data.success) {
                router.push('/adminControl');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('OTP 설정 중 오류가 발생했습니다.', error);
            setError('OTP 설정 중 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <Head>
                <title>OTP 설정</title>
                <link rel="stylesheet" type="text/css" href="/css/live2dStyle.css" />
            </Head>
            <div className="relative w-screen h-screen bg-cover bg-center">
                <canvas id="canvas" className="absolute top-0 left-0 w-full h-full"></canvas>
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
                    <div className="text-area mb-6">
                        <div className="header flex items-center justify-between p-2 rounded-t-lg">
                            <span className="title-text">OTP 설정</span>
                        </div>
                        <div className="content p-4">
                            {error && <p className="text-red-500 mb-2">{error}</p>}
                            <p className="description-text">QR 코드를 스캔하여 OTP를 설정하세요.</p>
                            <div className="qr-code-container flex flex-col items-center">
                                {qrCodeUrl && <img src={qrCodeUrl} alt="OTP QR Code" className="my-4" />}
                                <p className="description-text">서버 시간: {serverTime}</p>
                                <p className="description-text">클라이언트 시간: {clientTime}</p>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="login-area flex flex-col items-center">
                        <div className="flex items-center mb-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="chat-input"
                                placeholder="비밀번호를 입력하세요"
                            />
                        </div>
                        <div className="flex items-center mb-4">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="chat-input"
                                placeholder="OTP를 입력하세요"
                            />
                        </div>
                        <button type="submit" className="bg-green-500 text-white p-2 rounded">
                            전송
                        </button>
                    </form>
                </div>
            </div>
            <style jsx>{`
                button {
                    width: 100px;
                    padding: 10px;
                    border-radius: 20px;
                    font-size: 16px;
                    cursor: pointer;
                }
            `}</style>
        </>
    );
};

export default SetupOtp;

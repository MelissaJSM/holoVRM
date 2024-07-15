import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Login = () => {
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const userId = "admin"; // ID를 자동으로 "admin"으로 설정

    useEffect(() => {
        const loadScript = (src: string) => {
            return new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script ${src}`));
                document.head.appendChild(script);
            });
        };

        const loadScripts = async () => {
            try {
                await loadScript('/js/live2dcubismcore.min.js');
                await loadScript('https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/pixi.js@6.5.2/dist/browser/pixi.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/extra.min.js');
                await loadScript('/js/live2dModeling.js');
            } catch (error) {
                console.error(error);
            }
        };

        loadScripts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, password, otp, isIntroduction: false }),
            });

            const data = await response.json();
            if (data.success) {
                if (data.otpSetupRequired) {
                    router.push('/setup-otp');
                } else {
                    localStorage.setItem('token', data.token);
                    router.push('/adminControl');
                }
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('로그인 중 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <Head>
                <title>로그인</title>
                <link rel="stylesheet" type="text/css" href="/css/live2dStyle.css" />
            </Head>
            <div className="relative w-screen h-screen">
                <canvas id="canvas" className="absolute top-0 left-0 w-full h-full"></canvas>
                <div className="absolute inset-0 flex flex-col justify-end items-center p-4">
                    <div className="text-area mb-6">
                        <div className="header flex items-center justify-between p-2 rounded-t-lg">
                            <span className="title-text">루시아 발렌타인</span>
                        </div>
                        <div className="content p-4">
                            <p className="description-text" style={{ marginTop: '20px' }}>관리자 페이지로 진입하려고 하시는군요.</p>
                            <p className="description-text" style={{ marginTop: '10px' }}>당신이 멜리사 파파가 맞는지 확인이 필요해요.</p>
                            <p className="description-text" style={{ marginTop: '10px' }}>비밀번호, OTP를 입력하고 저한테 제출해주세요.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="login-area flex flex-col items-center mb-16" style={{ marginBottom: "80px" }}>
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
                        {error && <p className="text-red-500 mb-2">{error}</p>}
                        <button type="submit" className="bg-green-500 text-white p-2 rounded">
                            전송
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Login;

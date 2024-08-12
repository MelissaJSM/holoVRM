import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const router = useRouter();
    const { token } = router.query;

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.onload = () => {
            if (window.turnstile) {
                window.turnstile.render('#turnstile-widget', {
                    sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!,
                    callback: (token: string) => {
                        setTurnstileToken(token);
                    },
                });
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password, turnstileToken }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage('비밀번호가 성공적으로 재설정되었습니다.');
                setError('');
            } else {
                setError(data.message);
                setMessage('');
            }
        } catch (error) {
            setError('비밀번호 재설정 중 오류가 발생했습니다.');
            setMessage('');
        }
    };

    const handleBack = () => {
        router.push('/');
    };

    const backgroundImageUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

    const divStyle = {
        backgroundImage: `url(${backgroundImageUrl}background/default.png)`,
        backgroundSize: 'cover',
    };

    return (
        <div className="absolute z-40 w-full h-full flex items-center justify-center px-24 py-40 bg-black/30 font-M_PLUS_2" style={divStyle}>
            <div className="max-w-4xl max-h-full p-24 overflow-auto bg-white/90 rounded-16">
                <div className="my-24">
                    <div
                        className="my-8 font-bold typography-20 text-secondary"
                        style={{
                            fontSize: "32px",
                            color: '#4299e1',
                            transition: 'color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#3182ce'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#4299e1'}
                        onMouseDown={(e) => {
                            e.currentTarget.style.color = '#2b6cb0';
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.color = '#3182ce';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        비밀번호 재설정
                    </div>

                    <br /><br />
                    <div className="my-8 text-black font-bold">새로운 비밀번호를 입력해 주세요.</div>

                    <div className="my-24">
                        <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                        />
                        <div id="turnstile-widget" className="my-4"></div>
                        {error && <div className="my-4 text-red-600">{error}</div>}
                        {message && <div className="my-4 text-green-600">{message}</div>}
                        <br /><br />
                        <button
                            onClick={handleResetPassword}
                            className="font-bold text-white px-24 py-8 rounded-oval"
                            style={{
                                backgroundColor: '#4299e1',
                                color: 'white',
                                transition: 'background-color 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299e1'}
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = '#2b6cb0';
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = '#3182ce';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            disabled={!turnstileToken}
                        >
                            비밀번호 재설정
                        </button>
                        <br /><br />
                        <button
                            onClick={handleBack}
                            className="font-bold text-white px-24 py-8 rounded-oval"
                            style={{
                                backgroundColor: '#48BB78',
                                color: 'white',
                                transition: 'background-color 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48BB78'}
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = '#2f855a';
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = '#38a169';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

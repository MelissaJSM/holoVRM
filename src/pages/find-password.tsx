import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const FindPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        loadTurnstile();

        return () => {
            removeTurnstile();
        };
    }, []);

    const loadTurnstile = () => {
        removeTurnstile();  // 기존 Turnstile 위젯 삭제

        const script = document.createElement('script');
        script.id = 'turnstile-script';
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
    };

    const removeTurnstile = () => {
        const widget = document.getElementById('turnstile-widget');
        if (widget) {
            widget.innerHTML = '';  // 기존 Turnstile 위젯 제거
        }

        const script = document.getElementById('turnstile-script');
        if (script) {
            document.body.removeChild(script);
        }
    };

    const handleFindPassword = async () => {
        if (!email) {
            setError('이메일을 입력하세요.');
            return;
        }

        if (!turnstileToken) {
            setError('Turnstile 체크를 완료해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/find-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, turnstileToken }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage('비밀번호 재설정 이메일이 발송되었습니다.');
                setError('');
            } else {
                setError(data.message);
                setMessage('');
                loadTurnstile();  // 실패 시 새로 Turnstile 위젯 생성
            }
        } catch (error) {
            setError('비밀번호 찾기 중 오류가 발생했습니다.');
            setMessage('');
            loadTurnstile();  // 오류 발생 시 새로 Turnstile 위젯 생성
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
                        비밀번호 찾기
                    </div>

                    <br/><br/>
                    <div className="my-8 text-black font-bold">이메일을 입력해 주세요.</div>
                    <div className="my-8 text-red-600">회원 가입 시 이메일을 입력하지 않은 경우 사용 할 수 없습니다.</div>

                    <div className="my-24">
                        <input
                            type="email"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                        />
                        <div id="turnstile-widget" className="my-4"></div>
                        {error && <div className="my-4 text-red-600">{error}</div>}
                        {message && <div className="my-4 text-green-600">{message}</div>}
                        <br/><br/>
                        <button
                            onClick={handleFindPassword}
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
                            비밀번호 찾기
                        </button>
                        <br/><br/>
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

export default FindPassword;

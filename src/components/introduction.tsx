import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Link } from './link';

type Props = {
    openAiKey: string;
    onChangeAiKey: (openAiKey: string) => void;
    onSubmitUserId: (userId: string, isSession: boolean, lastCharacter?: string) => void;
    onResetChatLog: () => void;
    onOpenSettings: () => void;
};

export const Introduction: React.FC<Props> = ({
                                                  onSubmitUserId,
                                                  onResetChatLog,
                                                  onOpenSettings,
                                              }) => {
    const [opened, setOpened] = useState(true);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const logIp = async () => {
            try {
                await fetch('/api/logIp', {
                    method: 'POST',
                });
            } catch (error) {
                console.error('Failed to log IP address:', error);
            }
        };
        logIp();
    }, []);

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

    const handleStart = async () => {
        if (loading) return;
        setLoading(true);
        //console.log('handleStart called');

        if (!turnstileToken) {
            setError('Turnstile 체크를 완료해주세요.');
            setLoading(false);
            return;
        }

        if (userId && password) {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, password, isIntroduction: true, turnstileToken }),
                });
                const data = await response.json();
                if (data.success) {
                    //console.log('Login successful');
                    if (userId === 'admin') {
                        router.push('/login');
                    } else {
                        onResetChatLog();
                        onSubmitUserId(userId, false, data.lastCharacter); // isSession을 false로 전달
                        setOpened(false);

                        //console.log('Recording login attempt');
                        await fetch('/api/recordLoginAttempt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ type: 'user', userId: userId }),
                        }).then(() => {
                            //console.log('Login attempt recorded');
                            setLoading(false);
                        }).catch(() => {
                            setLoading(false);
                        });
                    }
                } else {
                    setError(data.message);
                    setLoading(false);
                }
            } catch (error) {
                setError('로그인 중 오류가 발생했습니다.');
                setLoading(false);
            }
        } else if (userId) {
            alert('비밀번호를 입력해 주세요.');
            setLoading(false);
        } else {
            const confirmSession = window.confirm('설정창으로 이동합니다. 홀로라이브 멤버를 선택 해 주세요.\n해당 대화는 저장되지 않는 모드입니다. 계속하시겠습니까?');
            if (confirmSession) {
                handleSessionLogin();
            } else {
                setLoading(false);
            }
        }
    };

    const handleSessionLogin = async () => {
        const sessionId = `session_${Date.now()}`;
        sessionStorage.setItem('sessionUserId', sessionId);
        sessionStorage.removeItem(`chatVRMParams_${sessionId}`);
        onResetChatLog();
        onSubmitUserId(sessionId, true); // isSession을 true로 전달

        //console.log('Recording session login attempt');
        await fetch('/api/recordLoginAttempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'session', userId: sessionId }),
        }).then((response) => response.json()).then((data) => {
            if (!data.success) {
                console.error('Error recording session login attempt:', data.message);
            } else {
                //console.log('Session login attempt recorded successfully');
            }
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });

        setOpened(false);
        onOpenSettings();
    };

    const handleSignup = () => {
        router.push('/signup');
    };

    const handleDetail = () => {
        router.push('/detail');
    };

    const handleDeleteUser = async () => {
        if (!userId || !password) {
            setError('ID와 비밀번호를 입력하세요.');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, password }),
            });
            const data = await response.json();
            if (!data.success) {
                setError('계정이 존재하지 않거나 ID와 비밀번호가 일치하지 않습니다.');
                return;
            }
        } catch (error) {
            setError('계정 확인 중 오류가 발생했습니다.');
            return;
        }

        const confirmDelete = window.confirm('정말로 계정을 삭제하시겠습니까?\n삭제된 계정은 복구되지 않습니다.');
        if (!confirmDelete) return;

        try {
            const response = await fetch('/api/deleteAccount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, password }),
            });
            const data = await response.json();
            if (data.success) {
                alert('계정이 삭제되었습니다.');
                router.push('/');
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('계정 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleStart();
        }
    };

    const handleFindId = () => {
        router.push('/find-id'); // 아이디 찾기 페이지로 이동
    };

    const handleFindPassword = () => {
        router.push('/find-password'); // 비밀번호 찾기 페이지로 이동
    };

    const backgroundImageUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

    const divStyle = {
        backgroundImage: `url(${backgroundImageUrl}background/default.png)`,
        backgroundSize: 'cover',
    };

    return opened ? (
        <div className="absolute z-40 w-full h-full px-24 py-40 font-M_PLUS_2 flex items-center justify-center" style={divStyle}>

            <div className="mx-auto my-auto max-w-5xl max-h-full p-24 overflow-auto bg-white/90 rounded-16" style={{
                overflow: 'auto',
                borderRadius: '16px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#ccc transparent'
            }}>
                <style jsx>{`
                    ::-webkit-scrollbar {
                        width: 8px;
                    }

                    ::-webkit-scrollbar-thumb {
                        background-color: #ccc;
                        border-radius: 4px;
                    }

                    ::-webkit-scrollbar-track {
                        background: transparent;
                    }
                `}</style>
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary" style={{fontSize: "32px"}}>
                        HoloVRM<span style={{fontSize: "18px"}}>(ver. 2.0.0)</span>
                    </div>
                    <br/>
                    <div>
                        HoloVRM은 마이크, 문자 입력, 음성 합성 등을 통해 AI 홀로라이브 멤버와 대화를 즐길 수 있는 웹 브라우저 기반 시스템입니다.
                    </div>
                </div>

                <div className="my-24">
                    <button
                        onClick={handleDetail}
                        className="font-bold text-white px-24 py-8 rounded-oval"
                        style={{
                            backgroundColor: '#4299e1',  // 기본 배경색 푸른 계열
                            color: 'white',
                            transition: 'background-color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}  // hover 색상
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299e1'}  // 기본 배경색
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = '#2b6cb0';  // active 색상
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = '#3182ce';  // hover 색상
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        기능 및 사용 가이드
                    </button>
                </div>

                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">사용자 ID</div>
                    <input
                        type="text"
                        placeholder="ID를 입력하세요"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                        onKeyPress={handleKeyPress}
                    />
                    <div className="my-8 font-bold typography-20 text-secondary">비밀번호</div>
                    <input
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                        onKeyPress={handleKeyPress}
                    />
                </div>

                <div>
                    사용자 ID 와 비밀번호를 입력하지 않고 로그인을 누르면 비회원으로 시작 가능합니다.
                </div>

                <div id="turnstile-widget" className="my-4"></div>
                {error && <div className="my-4 text-red-600">{error}</div>}
                <div className="my-24">
                    <button
                        onClick={handleStart}
                        className="font-bold text-white px-24 py-8 rounded-oval"
                        style={{
                            backgroundColor: '#4299e1',  // 기본 배경색 푸른 계열
                            color: 'white',
                            transition: 'background-color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}  // hover 색상
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299e1'}  // 기본 배경색
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = '#2b6cb0';  // active 색상
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = '#3182ce';  // hover 색상
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        disabled={loading}
                    >
                        로그인
                    </button>
                </div>
                <div className="my-24">
                    <button
                        onClick={handleSignup}
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
                        회원가입
                    </button>
                </div>
                <div className="my-24">
                    <button
                        onClick={handleDeleteUser}
                        className="font-bold text-white px-24 py-8 rounded-oval"
                        style={{
                            backgroundColor: '#f56565',
                            color: 'white',
                            transition: 'background-color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f56565'}
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = '#c53030';
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = '#e53e3e';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        ID 삭제하기
                    </button>
                </div>
                <div className="my-24">
                    <button
                        onClick={handleFindId}
                        className="font-bold text-white px-24 py-8 rounded-oval"
                        style={{
                            backgroundColor: '#ECC94B', // 노란색 배경
                            color: 'white',
                            transition: 'background-color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#D69E2E'}  // hover 색상
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ECC94B'}  // 기본 배경색
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = '#B7791F';  // active 색상
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = '#D69E2E';  // hover 색상
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        아이디 찾기
                    </button>
                </div>
                <div className="my-24">
                    <button
                        onClick={handleFindPassword}
                        className="font-bold text-white px-24 py-8 rounded-oval"
                        style={{
                            backgroundColor: '#ECC94B', // 노란색 배경
                            color: 'white',
                            transition: 'background-color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#D69E2E'}  // hover 색상
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ECC94B'}  // 기본 배경색
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = '#B7791F';  // active 색상
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = '#D69E2E';  // hover 색상
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        비밀번호 찾기
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

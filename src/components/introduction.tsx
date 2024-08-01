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
        console.log('handleStart called');

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
                    console.log('Login successful');
                    if (userId === 'admin') {
                        router.push('/login');
                    } else {
                        onResetChatLog();
                        onSubmitUserId(userId, false, data.lastCharacter); // isSession을 false로 전달
                        setOpened(false);

                        console.log('Recording login attempt');
                        await fetch('/api/recordLoginAttempt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ type: 'user', userId: userId }),
                        }).then(() => {
                            console.log('Login attempt recorded');
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

        console.log('Recording session login attempt');
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
                console.log('Session login attempt recorded successfully');
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

    const backgroundImageUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

    const divStyle = {
        backgroundImage: `url(${backgroundImageUrl}background/default.png)`,
        backgroundSize: 'cover',
    };

    return opened ? (
        <div className="absolute z-40 w-full h-full px-24 py-40 font-M_PLUS_2" style={divStyle}>
            <div className="mx-auto my-auto max-w-5xl max-h-full p-24 overflow-auto bg-white/90 rounded-16" style={{ overflow: 'auto', borderRadius: '16px', scrollbarWidth: 'thin', scrollbarColor: '#ccc transparent' }}>
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
                    <div className="my-8 font-bold typography-20 text-secondary"
                         style={{fontSize: "32px"}}>
                        HoloVRM(0.9.9 beta)
                    </div>
                    <br/>
                    <div>
                        HoloVRM은 마이크, 문자 입력, 음성 합성 등을 통해 AI 홀로라이브 멤버와 대화를 즐길 수 있는 웹 브라우저 기반 시스템입니다.
                    </div>
                </div>

                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">기술</div>
                    <div>
                        <Link url={"https://github.com/pixiv/three-vrm"} label={"@pixiv/three-vrm"}/> &nbsp; :
                        @pixiv/three-vrm은 3D 모델을 표시하고 조작하는 데 사용되었습니다. <br/> tts 모델은 rvc 모델을 바탕으로 8천개의 음성을 해당 멤버의 목소리로
                        딥러닝 시킨 후 vits 를 사용하여 tts 작업을 하였습니다.
                        <br/> 또한, 음성인식은 각 인터넷 브라우저의 음성인식 기능을 사용하므로 브라우저마다 성능이 다를 수 있습니다.
                        <br/><br/>
                        <Link url={"https://openai.com/index/openai-api/"} label={"Open ai API"}/> &nbsp; : 인격은 chatGPT를
                        이용하여 부여하였습니다. 또한 개발자의 비용 부담을 줄이기 위해 다음과 같이 모델을 세분화했습니다.
                        <br/><br/>
                        <div className="font-bold">
                            - 비회원 로그인: chatGPT4o-mini (캐릭터의 컨셉을 유지하며 일반적인 대화가 가능하지만 정보의 정확도가 낮을 수 있습니다.)
                            <br/>
                            - 회원 로그인: chatGPT4o (캐릭터의 컨셉과 대화의 정확도가 매우 높습니다.)
                        </div>
                        <br/>
                        좀더 진지하고 정확한 정보를 원하시면 회원 로그인을 하신 후 chatGPT4o 버전으로 대화하심을 추천드립니다.
                        <br/>
                    </div>

                    <div className="my-24">
                        <div className="my-8 font-bold typography-20 text-secondary">원본 및 수정</div>
                        이 소스코드는 원본 ChatVRM을 참고하여 재구성되었습니다.
                        <br/>
                        원본: &nbsp;
                        <Link url={"https://github.com/zoan37/ChatVRM"} label={"https://github.com/zoan37/ChatVRM"}/>
                        <br/>
                        HoloVRM: &nbsp;
                        <Link url={"https://github.com/MelissaJSM/holoVRM"}
                              label={"https://github.com/MelissaJSM/holoVRM"}/>
                    </div>
                </div>

                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">사용 조항</div>
                    <div>
                        의도적으로 차별적이거나 폭력적인 발언, 특정인을 비하하는 발언을 하지 마십시오.
                        <br/>
                        <div style={{ color: 'red', fontWeight: 'bold' }}>"봇 및 DDoS 공격 방지를 포함한 부수적 피해를 방지하기 위해 클라우드 플레어를 포함한 추가적인 보안 조치를 취할 수 있습니다"</div>
                        <br/>

                        그 외에는 자유롭게 사용하셔도 됩니다.

                    </div>
                </div>
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">OpenAI API key 입력</div>
                    <div>
                        개발자가 비용의 한계를 느낄 때 이 기능이 활성화됩니다.
                    </div>
                </div>
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">로그인 / 회원가입 / 회원탈퇴</div>
                    <div className="my-16">
                        ID와 비밀번호를 입력 후 "로그인" 버튼을 누르면 로그인이 됩니다.
                    </div>
                    <div className="my-16">
                        회원가입 버튼을 누르면 가입 페이지로 이동합니다.
                    </div>
                    <div className="my-16">
                        ID와 비밀번호를 입력 후 "ID 삭제하기" 버튼을 누르면 회원 탈퇴가 진행됩니다.
                    </div>
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

            </div>
        </div>
    ) : null;
};

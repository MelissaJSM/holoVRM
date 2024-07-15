import React, {useState} from 'react';
import {useRouter} from 'next/router';
import {Link} from './link';

type Props = {
    openAiKey: string;
    elevenLabsKey: string;
    onChangeAiKey: (openAiKey: string) => void;
    onChangeElevenLabsKey: (elevenLabsKey: string) => void;
    onSubmitUserId: (userId: string, isSession: boolean, lastCharacter?: string) => void;
    onResetChatLog: () => void;
    onOpenSettings: () => void;
};

export const Introduction = ({openAiKey, onChangeAiKey, onSubmitUserId, onResetChatLog, onOpenSettings}: Props) => {
    const [opened, setOpened] = useState(true);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleStart = async () => {
        if (loading) return;  // 로딩 중이면 중복 실행 방지
        setLoading(true);
        console.log('handleStart called');

        if (userId && password) {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({userId, password, isIntroduction: true})
                });
                const data = await response.json();
                if (data.success) {
                    console.log('Login successful');
                    if (userId === 'admin') {
                        router.push('/login');
                    } else {
                        onResetChatLog();
                        onSubmitUserId(userId, false, data.lastCharacter);
                        setOpened(false);

                        // 회원 로그인 시도 기록 추가
                        console.log('Recording login attempt');
                        await fetch('/api/recordLoginAttempt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({type: 'user', userId: userId})
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
        onSubmitUserId(sessionId, true);

        console.log('Recording session login attempt');
        await fetch('/api/recordLoginAttempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({type: 'session', userId: sessionId})
        }).then(response => response.json()).then(data => {
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
                body: JSON.stringify({userId, password})
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
                body: JSON.stringify({userId, password})
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

    return opened ? (
        <div className="absolute z-40 w-full h-full px-24 py-40 font-M_PLUS_2"
             style={{backgroundImage: 'url(/background.png)', backgroundSize: 'cover'}}>
            <div className="mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white/90 rounded-16">
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">
                        HoloVRM(0.9.4 beta)
                    </div>
                    <div>
                        마이크, 문자 입력, 음성 합성 등을 이용해 웹 브라우저만으로 AI 홀로라이브 멤버와 대화를 즐길 수 있는 웹 브라우저 기반 대화 시스템입니다.
                    </div>
                </div>
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">기술</div>
                    <div>
                        <Link url={"https://github.com/pixiv/three-vrm"} label={"@pixiv/three-vrm"}/>&nbsp; :
                        @pixiv/3-vrm은 3D 모델을 표시하고 조작하는 데 사용되었습니다. <br/> tts 모델은 rvc 모델을 바탕으로 8천개의 음성을 해당 멤버의 목소리로 딥러닝 시킨
                        후 vits 를 사용하여 tts 작업을 하였습니다.
                        <br/> 또한, 음성인식은 인터넷 브라우저의 음성인식을 사용하였으므로 브라우저마다 성능이 조금 다를 수 있습니다.
                        <br/>
                        <Link url={"https://openai.com/index/openai-api/"} label={"Open ai API"}/>&nbsp; : 인격은 chatGPT4o
                        를 이용하여 부여하였으며 세세한 대화를 위하여 장문을 사용하였습니다.
                        <br/>
                    </div>
                    <div className="my-16">
                        이 소스코드는 원본 ChatVRM 을 참고하여 재구성 하였습니다.
                        <br/>
                        원본: &nbsp;
                        <Link url={"https://github.com/zoan37/ChatVRM"} label={"https://github.com/zoan37/ChatVRM"}/>
                        <br/>
                        HoloVrm : &nbsp;
                        <Link url={"https://github.com/MelissaJSM/holoVRM"}
                              label={"https://github.com/MelissaJSM/holoVRM"}/>
                    </div>
                </div>

                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">사용조항</div>
                    <div>
                        의도적으로 차별적이거나 폭력적인 발언, 특정인을 비하하는 발언을 유도하지 마십시오.
                        <br/>
                        그 외에는 자유롭게 사용하셔도 됩니다.
                    </div>
                </div>
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">OpenAI API</div>
                    {/*<input*/}
                    {/*    type="text"*/}
                    {/*    placeholder="Open AI Key"*/}
                    {/*    value={"구현중"}*/}
                    {/*    className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"*/}
                    {/*    onKeyPress={handleKeyPress}*/}
                    {/*></input>*/}
                    <div>
                        개발자가 비용의 한계를 느낄 때 여기 기능이 활성화 됩니다.
                        {/*<br/>*/}
                        {/*Open AI 의 API Key 를 입력해주세요.&nbsp;*/}
                        {/*<Link url="https://platform.openai.com/" label="OpenAI API website"/>.*/}
                    </div>
                    {/*<div className="my-16">*/}
                    {/*    입력한 API 키는 브라우저에서 바로 사용하여 OpenAI API를 호출하므로 서버에 저장되지 않습니다.*/}
                    {/*</div>*/}

                    <div className="my-24">
                        <div className="my-8 font-bold typography-20 text-secondary">로그인 / 회원가입 / 회원탈퇴</div>

                        <div className="my-16">
                            ID와 비밀번호를 입력 후 "이해하였으며 시작합니다." 버튼을 누르면 로그인이 됩니다.
                        </div>
                        <div className="my-16">
                            회원가입 버튼을 누르면 가입 페이지로 이동합니다.
                        </div>
                        <div className="my-16">
                            ID와 비밀번호를 입력 후 "ID 삭제하기" 버튼을 누르면 회원 탈퇴가 진행됩니다.
                        </div>
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
                {error && <div className="my-4 text-red-600">{error}</div>}
                <div className="my-24">
                    <button onClick={handleStart}
                            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
                            disabled={loading}>
                        이해하였으며 시작합니다.
                    </button>
                </div>
                <div className="my-24">
                    <button onClick={handleSignup} className="font-bold text-white px-24 py-8 rounded-oval"
                            style={{backgroundColor: '#48BB78', color: 'white'}}>
                        회원가입
                    </button>
                </div>
                <div className="my-24">
                    <button onClick={handleDeleteUser} className="font-bold text-white px-24 py-8 rounded-oval"
                            style={{backgroundColor: '#f56565', color: 'white'}}>
                        ID 삭제하기
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

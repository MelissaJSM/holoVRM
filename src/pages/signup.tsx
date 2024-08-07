import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const Signup = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const router = useRouter();

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

    const handleSignup = async () => {
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, password, turnstileToken })
            });
            const data = await response.json();
            if (data.success) {
                alert('회원가입이 완료되었습니다.');
                router.push('/');
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('회원가입 중 오류가 발생했습니다.');
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
                            fontSize:"32px",
                            color: '#4299e1', // 기본 텍스트 색상 (푸른 계열)
                            transition: 'color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#3182ce'} // hover 색상
                        onMouseOut={(e) => e.currentTarget.style.color = '#4299e1'} // 기본 텍스트 색상
                        onMouseDown={(e) => {
                            e.currentTarget.style.color = '#2b6cb0'; // active 색상
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.color = '#3182ce'; // hover 색상
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        회원가입
                    </div>

                    <br/><br/>
                    <div className="my-8 text-black font-bold">
                        <p>회원가입 시 안내 조항:</p><br/>
                        <ul className="list-disc list-inside">
                            <li>비밀번호 보호: 회원님의 계정 비밀번호는 암호화되어 안전하게 보호됩니다.</li>
                            <li>채팅 로그 저장: 계정으로 로그인 시 채팅 로그가 저장됩니다.</li>
                            <li>채팅 로그 불러오기: 로그인 시 선택한 홀로멤과의 채팅 로그를 불러올 수 있습니다.</li>
                            <li>계정 삭제: 계정 삭제 시 해당 계정의 모든 데이터는 데이터베이스에서 완전히 삭제되며, 복구할 수 없습니다.</li>
                            <br/>
                        </ul>
                    </div>

                    <div className="my-8 text-black font-bold">아이디와 비밀번호를 입력 해 주세요.</div>

                    <div className="my-24">
                        <input
                            type="text"
                            placeholder="ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
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
                        <br />
                        <br />
                        <button
                            onClick={handleSignup}
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
                            disabled={!turnstileToken}
                        >
                            회원가입
                        </button>
                        <br />
                        <br />
                        <button
                            onClick={handleBack}
                            className="font-bold text-white px-24 py-8 rounded-oval"
                            style={{
                                backgroundColor: '#48BB78',  // 기본 배경색 초록 계열
                                color: 'white',
                                transition: 'background-color 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}  // hover 색상
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48BB78'}  // 기본 배경색
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = '#2f855a';  // active 색상
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = '#38a169';  // hover 색상
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

export default Signup;

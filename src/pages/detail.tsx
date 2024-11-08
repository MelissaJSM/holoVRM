import { useRouter } from 'next/router';
import {Link} from "@/components/link";

const detail = () => {
    const router = useRouter();

    const handleBack = () => {
        router.push('/');
    };

    // 배경화면 설정을 위한 URL 설정
    const backgroundImageUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

    const divStyle = {
        backgroundImage: `url(${backgroundImageUrl}background/default.png)`,
        backgroundSize: 'cover',
    };

    return (
        <div className="absolute z-40 w-full h-full flex items-center justify-center px-24 py-40 bg-black/30 font-M_PLUS_2" style={divStyle}>
            <div className="max-w-4xl max-h-full p-24 overflow-auto bg-white/90 rounded-16">
                {/* 기술 섹션 */}
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">기술</div>
                    <div>
                        <Link url={"https://github.com/pixiv/three-vrm"} label={"@pixiv/three-vrm"} /> &nbsp; :
                        @pixiv/three-vrm은 3D 모델을 표시하고 조작하는 데 사용되었습니다. <br /> tts 모델은 rvc 모델을 바탕으로 8천개의 음성을 해당 멤버의 목소리로
                        딥러닝 시킨 후 vits 를 사용하여 tts 작업을 하였습니다.
                        <br /> 또한, 음성인식은 각 인터넷 브라우저의 음성인식 기능을 사용하므로 브라우저마다 성능이 다를 수 있습니다.
                        <br /><br />
                        <Link url={"https://www.ibm.com/kr-ko/products/natural-language-understanding"} label={"IBM Watson Natural Language Understanding"} /> &nbsp; : 회원을 대상으로 대화를 분석하여 감정을 수치화하여
                        대화에 사용하도록 합니다.
                        <br /><br />
                        <Link url={"https://openai.com/index/openai-api/"} label={"Open ai API"} /> &nbsp; : 인격은 chatGPT를
                        이용하여 부여하였습니다. 또한 개발자의 비용 부담을 줄이기 위해 다음과 같이 모델을 세분화했습니다.
                        <br /><br />
                        <div className="font-bold">
                            - 비회원 로그인: chatGPT4o-mini (캐릭터의 컨셉을 유지하며 일반적인 대화가 가능하지만 정보의 정확도가 낮을 수 있습니다.)
                            <br />
                            - 회원 로그인: chatGPT4o (캐릭터의 컨셉과 대화의 정확도가 매우 높습니다.)
                        </div>
                        <br />
                        좀더 진지하고 정확한 정보를 원하시면 회원 로그인을 하신 후 chatGPT4o 버전으로 대화하심을 추천드립니다.
                        <br />
                    </div>
                </div>

                {/* 원본 및 수정 섹션 */}
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">원본 및 수정</div>
                    이 소스코드는 원본 ChatVRM을 참고하여 재구성되었습니다.
                    <br />
                    원본: &nbsp;
                    <Link url={"https://github.com/zoan37/ChatVRM"} label={"https://github.com/zoan37/ChatVRM"} />
                    <br />
                    HoloVRM: &nbsp;
                    <Link url={"https://github.com/MelissaJSM/holoVRM"} label={"https://github.com/MelissaJSM/holoVRM"} />
                </div>

                {/* 사용 조항 섹션 */}
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">사용 조항</div>
                    <div>
                        의도적으로 차별적이거나 폭력적인 발언, 특정인을 비하하는 발언을 하지 마십시오.
                        <br />
                        <div style={{ color: 'red', fontWeight: 'bold' }}>
                            "봇 및 DDoS 공격 방지를 포함한 부수적 피해를 방지하기 위해 클라우드 플레어를 포함한 추가적인 보안 조치를 취할 수 있습니다"
                        </div>
                        <br />
                        그 외에는 자유롭게 사용하셔도 됩니다.
                    </div>
                </div>

                {/* OpenAI API key 입력 섹션 */}
                <div className="my-24">
                    <div className="my-8 font-bold typography-20 text-secondary">OpenAI API key 입력</div>
                    <div>
                        개발자가 비용의 한계를 느낄 때 이 기능이 활성화됩니다.
                    </div>
                </div>

                {/* 로그인 / 회원가입 / 회원탈퇴 섹션 */}
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

                {/* 돌아가기 버튼 */}
                <div className="my-24">
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
    );
};

export default detail;

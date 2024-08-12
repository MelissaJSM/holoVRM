import React, {useEffect, useState, useContext} from "react";
import {IconButton} from "./iconButton";
import {Message} from "@/features/messages/messages";
import {KoeiroParam} from "@/features/constants/koeiroParam";
import {CharacterVoiceParam} from "@/features/constants/characterVoiceParam";
import characterPrompts, {CharacterPrompts} from "@/features/constants/prompts";
import {ViewerContext} from "@/features/vrmViewer/viewerContext";

type Props = {
    openAiKey: string;
    systemPrompt: string;
    chatLog: Message[];
    characterVoiceParam: CharacterVoiceParam;
    koeiroParam: KoeiroParam;
    userId: string;
    summary: string;
    setSummary: React.Dispatch<React.SetStateAction<string>>;
    lastCharacter?: string;
    onClickClose: () => void;
    onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeCharacterVoice: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onChangeChatLog: (index: number, text: string) => void;
    onChangeKoeiroParam: (x: number, y: number) => void;
    onClickOpenVrmFile: () => void;
    onClickResetChatLog: () => void;
    onClickResetSystemPrompt: () => void;
    loadParams: (inputUserId: string) => void; // loadParams 함수 추가
};

export const Settings = ({
                             systemPrompt,
                             chatLog,
                             userId,
                             setSummary,
                             lastCharacter,
                             onClickClose,
                             onChangeSystemPrompt,
                             onChangeCharacterVoice,
                             onChangeChatLog,
                             onClickResetChatLog,
                             loadParams, // loadParams prop 사용

                         }: Props) => {
    const {viewer} = useContext(ViewerContext);
    let [selectedCharacter, setSelectedCharacter] = useState(lastCharacter || "default");
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        const fetchLastCharacter = async () => {
            if (userId.startsWith("session_")) {
                const sessionParams = sessionStorage.getItem(`chatVRMParams_${userId}`);
                if (sessionParams) {
                    const {characterVoiceParam, systemPrompt} = JSON.parse(sessionParams);
                    setSelectedCharacter(characterVoiceParam.voiceId);
                    onChangeCharacterVoice({target: {value: characterVoiceParam.voiceId}} as React.ChangeEvent<HTMLSelectElement>);
                    onChangeSystemPrompt({target: {value: systemPrompt}} as React.ChangeEvent<HTMLTextAreaElement>);
                    viewer.loadVrm(`${avatarBaseUrl}${characterVoiceParam.voiceId}.vrm`);
                }
            } else {
                try {
                    const response = await fetch(`/api/getLastCharacter?userId=${userId}`);
                    const data = await response.json();
                    if (data.success) {
                        const character = data.lastCharacter || "default";
                        setSelectedCharacter(character);
                        const characterPrompt = characterPrompts[character as keyof CharacterPrompts];
                        onChangeCharacterVoice({target: {value: character}} as React.ChangeEvent<HTMLSelectElement>);
                        onChangeSystemPrompt({target: {value: characterPrompt}} as React.ChangeEvent<HTMLTextAreaElement>);
                        viewer.loadVrm(`${avatarBaseUrl}${character}.vrm`);
                    }
                } catch (error) {
                    console.error('Error fetching last character:', error);
                }
            }
        };

        fetchLastCharacter();
    }, [userId, onChangeCharacterVoice, onChangeSystemPrompt, viewer]);

    useEffect(() => {
        console.log('초기 설정 캐릭터:', selectedCharacter);

        if (selectedCharacter.includes("miko")) {
            selectedCharacter = "miko_1st";
        } else if (selectedCharacter.includes("fubuki")) {
            selectedCharacter = "fubuki";
        } else if (selectedCharacter.includes("mio")) {
            selectedCharacter = "mio";
        } else if (selectedCharacter.includes("aqua")) {
            selectedCharacter = "aqua";
        } else if (selectedCharacter.includes("pekora")) {
            selectedCharacter = "pekora";
        } else if (selectedCharacter.includes("koyori")) {
            selectedCharacter = "koyori";
        } else if (selectedCharacter.includes("pekomama")) {
            selectedCharacter = "pekomama";
        }


        // 이걸 chat.ts 에서 쓰도록 하면되는데...
        console.log('중복 필터 캐릭터:', selectedCharacter);

        sessionStorage.setItem('character_degree', selectedCharacter);



            loadParams(userId); // loadParams 호출






        const characterPrompt = characterPrompts[selectedCharacter as keyof CharacterPrompts];

        onChangeSystemPrompt({target: {value: characterPrompt}} as React.ChangeEvent<HTMLTextAreaElement>);

    }, [selectedCharacter]);

    const handleCharacterChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value as keyof CharacterPrompts;
        setSelectedCharacter(selectedValue);
        console.log('캐릭터 변경:', selectedValue);

        if (!selectedValue.includes("default")) {
            window.dispatchEvent(new CustomEvent("changeAvatar", {detail: selectedValue}));
        }

        let adjustedValue = selectedValue;
        let promptValue = selectedValue;

        if (selectedValue.includes("miko")) {
            adjustedValue = selectedValue;
            promptValue = "miko_1st";
        } else if (selectedValue.includes("fubuki")) {
            adjustedValue = selectedValue;
            promptValue = "fubuki";
        } else if (selectedValue.includes("mio")) {
            adjustedValue = selectedValue;
            promptValue = "mio";
        } else if (selectedValue.includes("aqua")) {
            adjustedValue = selectedValue;
            promptValue = "aqua";
        } else if (selectedValue.includes("pekora")) {
            adjustedValue = selectedValue;
            promptValue = "pekora";
        } else if (selectedValue.includes("koyori")) {
            adjustedValue = selectedValue;
            promptValue = "koyori";
        } else if (selectedValue.includes("pekomama")) {
            adjustedValue = selectedValue;
            promptValue = "pekomama";
        }

        const characterPrompt = characterPrompts[promptValue as keyof CharacterPrompts];
        onChangeCharacterVoice({target: {value: adjustedValue}} as React.ChangeEvent<HTMLSelectElement>);
        onChangeSystemPrompt({target: {value: characterPrompt}} as React.ChangeEvent<HTMLTextAreaElement>);

        const updatedParams = {characterVoiceParam: {voiceId: adjustedValue}, systemPrompt: characterPrompt};
        if (userId.startsWith("session_")) {
            sessionStorage.setItem(`chatVRMParams_${userId}`, JSON.stringify(updatedParams));
        } else {
            window.localStorage.setItem(`chatVRMParams_${userId}`, JSON.stringify(updatedParams));
        }

        if (!userId.startsWith("session_")) {
            await fetch('/api/updateCharacter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({userId, lastCharacter: adjustedValue})
            });
        }

        viewer.loadVrm(`${avatarBaseUrl}${adjustedValue}.vrm`);
    };

    useEffect(() => {
        const body = document.body;
        if (selectedCharacter.includes("miko")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/miko_1st.png)`;
        } else if (selectedCharacter.includes("fubuki")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/fubuki.png)`;
        } else if (selectedCharacter.includes("mio")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/mio.png)`;
        } else if (selectedCharacter.includes("aqua")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/aqua.png)`;
        } else if (selectedCharacter.includes("pekora")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/pekora.png)`;
        } else if (selectedCharacter.includes("koyori")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/koyori.png)`;
        } else if (selectedCharacter.includes("pekomama")) {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/pekomama.png)`;
        } else {
            body.style.backgroundImage = `url(${avatarBaseUrl}background/${selectedCharacter}.png)`;
        }
    }, [selectedCharacter]);

    const handleResetSystemPrompt = () => {
        setIsVideoPlaying(true);
    };

    const handleVideoEnded = () => {
        setIsVideoPlaying(false);
    };

    const handleResetChatLog = async () => {
        let character_degree = sessionStorage.getItem('character_degree');

        if (userId.startsWith("session_")) {
            await fetch(`/api/chat-session?character_degree=${character_degree}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } else {
            await fetch(`/api/chat?userId=${userId}&character_degree=${character_degree}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        onClickResetChatLog();
        setSummary("");
        const storageKey = `chatVRMParams_${userId}`;
        if (userId.startsWith("session_")) {
            sessionStorage.removeItem(storageKey);
        } else {
            window.localStorage.removeItem(storageKey);
        }
    };

    const avatarBaseUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

    const characterOptions = [
        {value: "default", label: "캐릭터를 선택해주세요", image: `${avatarBaseUrl}background/default.png`},
        {value: "default", label: "----- 홀로라이브 0기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "sora", label: "토키노 소라", image: `${avatarBaseUrl}background/sora.png`},
        {value: "miko_1st", label: "사쿠라 미코(3.5 Channel)", image: `${avatarBaseUrl}background/miko_1st.png`},
        {value: "miko_miko", label: "사쿠라 미코(무녀)", image: `${avatarBaseUrl}background/miko_miko.png`},
        {value: "miko_3rd", label: "사쿠라 미코(일상복)", image: `${avatarBaseUrl}background/miko_3rd.png`},
        {value: "roboco", label: "로보코 씨", image: `${avatarBaseUrl}background/roboco.png`},
        {value: "azki", label: "AZKi", image: `${avatarBaseUrl}background/azki.png`},
        {value: "default", label: "----- 홀로라이브 1기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "haato", label: "아카이 하아토", image: `${avatarBaseUrl}background/haato.png`},
        {value: "matsuri", label: "나츠이로 마츠리", image: `${avatarBaseUrl}background/matsuri.png`},
        {value: "default", label: "----- 홀로라이브 2기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "aqua_made", label: "미나토 아쿠아(메이드)", image: `${avatarBaseUrl}background/aqua_made.png`},
        {value: "aqua", label: "미나토 아쿠아(사복)", image: `${avatarBaseUrl}background/aqua.png`},
        {value: "shion", label: "무라사키 시온", image: `${avatarBaseUrl}background/shion.png`},
        {value: "default", label: "----- 홀로라이브 게이머즈 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "fubuki", label: "시라카미 후부키", image: `${avatarBaseUrl}background/fubuki.png`},
        {value: "fubuki_bunny", label: "시라카미 후부키(버니)", image: `${avatarBaseUrl}background/fubuki_bunny.png`},
        {value: "korone", label: "이누가미 코로네", image: `${avatarBaseUrl}background/korone.png`},
        {value: "okayu", label: "네코마타 오카유", image: `${avatarBaseUrl}background/okayu.png`},
        {value: "mio", label: "오오카미 미오(사복)", image: `${avatarBaseUrl}background/mio.png`},
        {value: "mio_queen", label: "오오카미 미오(여왕)", image: `${avatarBaseUrl}background/mio.png`},
        {value: "mio_paka", label: "오오카미 미오(파카)", image: `${avatarBaseUrl}background/mio.png`},
        {value: "mio_osho", label: "오오카미 미오(정월)", image: `${avatarBaseUrl}background/mio.png`},
        {value: "default", label: "----- 홀로라이브 3기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "pekora", label: "우사다 페코라", image: `${avatarBaseUrl}background/pekora.png`},
        {value: "pekora_outfit", label: "우사다 페코라(사복)", image: `${avatarBaseUrl}background/pekora.png`},
        {value: "pekora_prisoner", label: "우사다 페코라(죄수)", image: `${avatarBaseUrl}background/pekora.png`},
        {value: "marine", label: "호쇼 마린", image: `${avatarBaseUrl}background/marine.png`},
        {value: "default", label: "----- 홀로라이브 4기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "watame", label: "츠노마키 와타메", image: `${avatarBaseUrl}background/watame.png`},
        {value: "luna", label: "히메모리 루나", image: `${avatarBaseUrl}background/luna.png`},
        {value: "default", label: "----- 홀로라이브 5기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "lamy", label: "유키하나 라미", image: `${avatarBaseUrl}background/lamy.png`},
        {value: "nene", label: "모모스즈 네네", image: `${avatarBaseUrl}background/nene.png`},
        {value: "default", label: "----- 비밀결사 holoX -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "laplus", label: "라프라스 다크니스", image: `${avatarBaseUrl}background/laplus.png`},
        {value: "koyori", label: "하쿠이 코요리", image: `${avatarBaseUrl}background/koyori.png`},
        {value: "koyori_off", label: "하쿠이 코요리(코트 탈의)", image: `${avatarBaseUrl}background/koyori.png`},
        {value: "chloe", label: "사카마타 클로에", image: `${avatarBaseUrl}background/chloe.png`},
        {value: "iroha", label: "카자마 이로하", image: `${avatarBaseUrl}background/iroha.png`},
        {value: "default", label: "----- HoloLive DEV_IS -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "raden", label: "주우후테이 라덴", image: `${avatarBaseUrl}background/raden.png`},
        {value: "kanade", label: "오토노세 카나데", image: `${avatarBaseUrl}background/kanade.png`},
        {value: "default", label: "----- Hololive Myth -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "gura", label: "가우르 구라", image: `${avatarBaseUrl}background/gura.png`},
        {value: "amelia", label: "왓슨 아멜리아", image: `${avatarBaseUrl}background/amelia.png`},
        {value: "ina", label: "니노마에 이나니스", image: `${avatarBaseUrl}background/ina.png`},
        {value: "default", label: "----- Hololive Promise -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "fauna", label: "세레스 파우나", image: `${avatarBaseUrl}background/fauna.png`},
        {value: "kronii", label: "오로 크로니", image: `${avatarBaseUrl}background/kronii.png`},
        {value: "mumei", label: "나나시 무메이", image: `${avatarBaseUrl}background/mumei.png`},
        {value: "irys", label: "IRYS", image: `${avatarBaseUrl}background/irys.png`},
        {value: "irys_jk", label: "IRYS_JK", image: `${avatarBaseUrl}background/irys.png`},
        {value: "default", label: "----- Hololive Advent -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "shiori", label: "시오리 노벨라", image: `${avatarBaseUrl}background/shiori.png`},
        {value: "fuwawa", label: "후와와 어비스가드", image: `${avatarBaseUrl}background/fuwawa.png`},
        {value: "mococo", label: "모코코 어비스가드", image: `${avatarBaseUrl}background/mococo.png`},
        {value: "bijou", label: "코세키 비쥬", image: `${avatarBaseUrl}background/bijou.png`},
        {value: "default", label: "----- Hololive ID 1기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "moona", label: "무나 호시노바", image: `${avatarBaseUrl}background/moona.png`},
        {value: "risu", label: "아윤다 리스", image: `${avatarBaseUrl}background/risu.png`},
        {value: "default", label: "----- Hololive ID 2기생 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "anya", label: "아냐 멜핏사", image: `${avatarBaseUrl}background/anya.png`},
        {value: "default", label: "----- 마마라이브 -----", image: `${avatarBaseUrl}background/default.png`},
        {value: "pekomama", label: "페코라 마미", image: `${avatarBaseUrl}background/pekomama.png`},
        {value: "pekomamaap", label: "페코라 마미(에이프런)", image: `${avatarBaseUrl}background/pekomama.png`},
        {value: "shigure", label: "시구레 우이", image: `${avatarBaseUrl}background/shigure.png`},

        // 추가적인 옵션들...
    ];


    const videoUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

    return (
        <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur">
            <div className="absolute m-24">
                <IconButton iconName="24/Close" isProcessing={false} onClick={onClickClose}></IconButton>
            </div>
            {isVideoPlaying && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    <video
                        src={`${videoUrl}koyori.mp4`}
                        className="h-full"
                        autoPlay
                        onEnded={handleVideoEnded}
                        style={{objectFit: "cover"}}
                        controls={false}
                    />
                </div>
            )}
            <div className="max-h-full overflow-auto">
                <div className="text-text1 max-w-3xl mx-auto px-24 py-64">
                    <div className="my-24 typography-32 font-bold">설정</div>

                    <div className="my-40 bg-gray-100 p-8 rounded-md">
                        <div className="my-16 typography-20 font-bold">AI 홀로라이브 멤버 선택</div>
                        <div className="my-16">대화 하고싶은 홀로라이브 멤버를 선택 해 주세요.</div>
                        <div className="my-8 relative">
                            <select
                                className="h-40 px-8 appearance-none w-full bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                id="select-dropdown"
                                onChange={handleCharacterChange}
                                value={selectedCharacter}
                                style={{
                                    backgroundImage: `url(${characterOptions.find(option => option.value === selectedCharacter)?.image})`,
                                    backgroundSize: '24px',
                                    backgroundPosition: 'right 8px center',
                                    backgroundRepeat: 'no-repeat',
                                    textAlign: characterOptions.find(option => option.value === selectedCharacter)?.value === "default" ? 'center' : 'left'
                                }}
                            >
                                {characterOptions.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        style={{
                                            textAlign: option.value === "default" ? 'center' : 'left'
                                        }}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="my-40 bg-gray-100 p-8 rounded-md">
                        <div className="my-8">
                            <div className="my-16 typography-20 font-bold">멤버 컨셉 설정(수동 변경해도 적용 되지 않을 수 있습니다.)</div>
                            <button
                                onClick={handleResetSystemPrompt}
                                style={{
                                    backgroundColor: '#f56565', // 기본 배경색 (레드 계열)
                                    color: 'white',
                                    padding: '10px 20px', // 버튼 패딩 조정
                                    borderRadius: '10px', // 둥근 모서리
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease, transform 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'} // hover 색상
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f56565'} // 기본 배경색
                                onMouseDown={(e) => {
                                    e.currentTarget.style.backgroundColor = '#c53030'; // active 색상
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e53e3e'; // hover 색상
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                캐릭터 컨셉을 리셋합니다.(누르지 마세요)
                            </button>
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={onChangeSystemPrompt}
                            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
                        ></textarea>
                    </div>
                    {chatLog.length > 0 && (
                        <div className="my-40 bg-gray-100 p-8 rounded-md">
                            <div className="my-8 grid-cols-2">
                                <div className="my-16 typography-20 font-bold">홀로라이브 멤버와의 채팅내역</div>
                                <button
                                    onClick={handleResetChatLog}
                                    style={{
                                        backgroundColor: '#f56565', // 기본 배경색 (레드 계열)
                                        color: 'white',
                                        padding: '10px 20px', // 버튼 패딩 조정
                                        borderRadius: '10px', // 둥근 모서리
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s ease, transform 0.2s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'} // hover 색상
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f56565'} // 기본 배경색
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.backgroundColor = '#c53030'; // active 색상
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.backgroundColor = '#e53e3e'; // hover 색상
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    채팅 내역 초기화
                                </button>

                            </div>
                            <div className="my-8">
                                {chatLog.map((value, index) => (
                                    <div key={index}
                                         className="my-8 grid grid-flow-col grid-cols-[min-content_1fr] gap-x-fixed">
                                        <div className="w-[64px] py-8">
                                            {value.role === "assistant" ? "Character" : "You"}
                                        </div>
                                        <input
                                            key={index}
                                            className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                                            type="text"
                                            value={value.content}
                                            onChange={(event) => {
                                                onChangeChatLog(index, event.target.value);
                                            }}
                                        ></input>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState, useContext } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import { KoeiroParam } from "@/features/constants/koeiroParam";
import { ElevenLabsParam } from "@/features/constants/elevenLabsParam";
import characterPrompts, { CharacterPrompts } from "@/features/constants/prompts";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";

const avatarBaseUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;

type Props = {
    openAiKey: string;
    elevenLabsKey: string;
    systemPrompt: string;
    chatLog: Message[];
    elevenLabsParam: ElevenLabsParam;
    koeiroParam: KoeiroParam;
    userId: string;
    summary: string;
    setSummary: React.Dispatch<React.SetStateAction<string>>;
    lastCharacter?: string;
    onClickClose: () => void;
    onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeElevenLabsKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeElevenLabsVoice: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onChangeChatLog: (index: number, text: string) => void;
    onChangeKoeiroParam: (x: number, y: number) => void;
    onClickOpenVrmFile: () => void;
    onClickResetChatLog: () => void;
    onClickResetSystemPrompt: () => void;
};

export const Settings = ({
                             openAiKey,
                             elevenLabsKey,
                             systemPrompt,
                             chatLog,
                             elevenLabsParam,
                             koeiroParam,
                             userId,
                             summary,
                             setSummary,
                             lastCharacter,
                             onClickClose,
                             onChangeSystemPrompt,
                             onChangeAiKey,
                             onChangeElevenLabsKey,
                             onChangeElevenLabsVoice,
                             onChangeChatLog,
                             onChangeKoeiroParam,
                             onClickOpenVrmFile,
                             onClickResetChatLog,
                             onClickResetSystemPrompt,
                         }: Props) => {
    const { viewer } = useContext(ViewerContext);
    const [selectedCharacter, setSelectedCharacter] = useState(lastCharacter || "default");
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        const fetchLastCharacter = async () => {
            try {
                const response = await fetch(`/api/getLastCharacter?userId=${userId}`);
                const data = await response.json();
                if (data.success) {
                    const character = data.lastCharacter || "default";
                    setSelectedCharacter(character);
                    const characterPrompt = characterPrompts[character as keyof CharacterPrompts];
                    onChangeElevenLabsVoice({ target: { value: character } } as React.ChangeEvent<HTMLSelectElement>);
                    onChangeSystemPrompt({ target: { value: characterPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);
                    viewer.loadVrm(`${avatarBaseUrl}${character}.vrm`); // 클라우드 플레어 URL 설정
                }
            } catch (error) {
                console.error('Error fetching last character:', error);
            }
        };

        if (!userId.startsWith("session_")) {
            fetchLastCharacter();
        }
    }, [userId, onChangeElevenLabsVoice, onChangeSystemPrompt, viewer]);

    useEffect(() => {
        console.log('초기 설정 캐릭터:', selectedCharacter);

        const characterPrompt = characterPrompts[selectedCharacter as keyof CharacterPrompts];
        onChangeSystemPrompt({ target: { value: characterPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);


    }, [selectedCharacter]);

    const handleCharacterChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value as keyof CharacterPrompts;
        setSelectedCharacter(selectedValue);
        console.log('캐릭터 변경:', selectedValue);

        if (!selectedValue.includes("default")) {
            window.dispatchEvent(new CustomEvent("changeAvatar", { detail: selectedValue }));
        }

        let adjustedValue = selectedValue;
        let promptValue = selectedValue;

        if (selectedValue.includes("miko")) {
            adjustedValue = selectedValue;
            promptValue = "miko_1st";
        } else if (selectedValue.includes("fubuki")) {
            adjustedValue = selectedValue;
            promptValue = "fubuki";
        } else if (selectedValue.includes("aqua")) {
            adjustedValue = selectedValue;
            promptValue = "aqua";
        } else if (selectedValue.includes("koyori")) {
            adjustedValue = selectedValue;
            promptValue = "koyori";
        }

        const characterPrompt = characterPrompts[promptValue as keyof CharacterPrompts];
        onChangeElevenLabsVoice({ target: { value: adjustedValue } } as React.ChangeEvent<HTMLSelectElement>);
        onChangeSystemPrompt({ target: { value: characterPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);

        const updatedParams = { elevenLabsParam: { voiceId: adjustedValue }, systemPrompt: characterPrompt };
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
                body: JSON.stringify({ userId, lastCharacter: adjustedValue })
            });
        }

        viewer.loadVrm(`${avatarBaseUrl}${adjustedValue}.vrm`); // 클라우드 플레어 URL 설정
    };

    useEffect(() => {
        const body = document.body;
        if (selectedCharacter.includes("miko")) {
            body.style.backgroundImage = `url(/miko_1st.png)`;
        } else if (selectedCharacter.includes("fubuki")) {
            body.style.backgroundImage = `url(/fubuki.png)`;
        } else if (selectedCharacter.includes("aqua")) {
            body.style.backgroundImage = `url(/aqua.png)`;
        } else if (selectedCharacter.includes("koyori")) {
            body.style.backgroundImage = `url(/koyori.png)`;
        } else {
            body.style.backgroundImage = `url(/${selectedCharacter}.png)`;
        }
    }, [selectedCharacter]);

    const handleResetSystemPrompt = () => {
        setIsVideoPlaying(true);
    };

    const handleVideoEnded = () => {
        setIsVideoPlaying(false);
    };

    const handleResetChatLog = async () => {
        await fetch(`/api/chat?userId=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        onClickResetChatLog();
        setSummary("");
        const storageKey = `chatVRMParams_${userId}`;
        if (userId.startsWith("session_")) {
            sessionStorage.removeItem(storageKey);
        } else {
            window.localStorage.removeItem(storageKey);
        }
    };

    const characterOptions = [
        { value: "default", label: "캐릭터를 선택해주세요", image: "/default.png" },
        { value: "default", label: "----- 홀로라이브 0기생 -----", image: "/default.png" },
        { value: "miko_1st", label: "사쿠라 미코(1세대)", image: "/miko_1st.png" },
        { value: "miko_miko", label: "사쿠라 미코(무녀)", image: "/miko_miko.png" },
        { value: "miko_3rd", label: "사쿠라 미코(3세대)", image: "/miko_3rd.png" },
        { value: "roboco", label: "로보코 씨", image: "/roboco.png" },
        { value: "default", label: "----- 홀로라이브 2기생 -----", image: "/default.png" },
        { value: "aqua_made", label: "미나토 아쿠아(메이드)", image: "/aqua_made.png" },
        { value: "aqua", label: "미나토 아쿠아(사복)", image: "/aqua.png" },
        { value: "shion", label: "무라사키 시온", image: "/shion.png" },
        { value: "default", label: "----- 홀로라이브 게이머즈 -----", image: "/default.png" },
        { value: "fubuki", label: "시라카미 후부키", image: "/fubuki.png" },
        { value: "fubuki_bunny", label: "시라카미 후부키(버니)", image: "/fubuki_bunny.png" },
        { value: "korone", label: "이누가미 코로네", image: "/korone.png" },
        { value: "okayu", label: "네코마타 오카유", image: "/okayu.png" },
        { value: "mio", label: "오오카미 미오", image: "/mio.png" },
        { value: "default", label: "----- 홀로라이브 3기생 -----", image: "/default.png" },
        { value: "pekora", label: "우사다 페코라", image: "/pekora.png" },
        { value: "default", label: "----- 비밀결사 holoX -----", image: "/default.png" },
        { value: "koyori", label: "하쿠이 코요리", image: "/koyori.png" },
        { value: "koyori_off", label: "하쿠이 코요리(코트 탈의)", image: "/koyori.png" },
        { value: "default", label: "----- Hololive Myth -----", image: "/default.png" },
        { value: "gura", label: "가우르 구라", image: "/gura.png" },

        // 추가적인 옵션들...
    ];

    return (
        <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur">
            <div className="absolute m-24">
                <IconButton iconName="24/Close" isProcessing={false} onClick={onClickClose}></IconButton>
            </div>
            {isVideoPlaying && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    <video
                        src="/koyori.mp4"
                        className="h-full"
                        autoPlay
                        onEnded={handleVideoEnded}
                        style={{ objectFit: "cover" }}
                        controls={false}
                    />
                </div>
            )}
            <div className="max-h-full overflow-auto">
                <div className="text-text1 max-w-3xl mx-auto px-24 py-64">
                    <div className="my-24 typography-32 font-bold">설정</div>

                    <div className="my-40 bg-gray-100 p-8 rounded-md">
                        <div className="my-16 typography-20 font-bold">홀로라이브 멤버 선택</div>
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
                            <div className="my-16 typography-20 font-bold">캐릭터 컨셉 설정(수동 변경해도 적용 되지 않을 수 있습니다.)</div>
                            <TextButton onClick={handleResetSystemPrompt}>캐릭터 컨셉을 리셋합니다.(누르지 마세요)</TextButton>
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
                                <TextButton onClick={handleResetChatLog}>채팅 내역 초기화</TextButton>
                            </div>
                            <div className="my-8">
                                {chatLog.map((value, index) => (
                                    <div key={index} className="my-8 grid grid-flow-col grid-cols-[min-content_1fr] gap-x-fixed">
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

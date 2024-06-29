import React, { useEffect, useState } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import { KoeiroParam } from "@/features/constants/koeiroParam";
import { Link } from "./link";
import characterPrompts, { CharacterPrompts } from "@/features/constants/prompts"; // 타입과 기본 내보내기 import
import { ElevenLabsParam } from "@/features/constants/elevenLabsParam"; // 추가된 import 구문

type Props = {
    openAiKey: string;
    elevenLabsKey: string;
    systemPrompt: string;
    chatLog: Message[];
    elevenLabsParam: ElevenLabsParam; // 정확한 타입 사용
    koeiroParam: KoeiroParam;
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
                             chatLog,
                             systemPrompt,
                             elevenLabsParam,
                             koeiroParam,
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
    const [selectedCharacter, setSelectedCharacter] = useState(elevenLabsParam.voiceId || "default");
    const [isVideoPlaying, setIsVideoPlaying] = useState(false); // 비디오 재생 상태 추가

    const handleCharacterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value as keyof CharacterPrompts;
        setSelectedCharacter(selectedValue);

        if(!selectedValue.includes("default")){
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
        }

        onChangeElevenLabsVoice({ target: { value: adjustedValue } } as React.ChangeEvent<HTMLSelectElement>);
        const newEvent = { target: { value: characterPrompts[promptValue] } } as React.ChangeEvent<HTMLTextAreaElement>;
        onChangeSystemPrompt(newEvent);

        // 변경된 캐릭터 정보를 저장
        const userId = sessionStorage.getItem("sessionUserId") || "default_user";
        const updatedParams = { elevenLabsParam: { voiceId: adjustedValue }, systemPrompt: characterPrompts[promptValue] };
        if (userId.startsWith("session_")) {
            sessionStorage.setItem(`chatVRMParams_${userId}`, JSON.stringify(updatedParams));
        } else {
            window.localStorage.setItem(`chatVRMParams_${userId}`, JSON.stringify(updatedParams));
        }
    };

    useEffect(() => {
        const body = document.body;
        if (selectedCharacter.includes("miko")) {
            body.style.backgroundImage = `url(/miko_1st.png)`;
        } else if (selectedCharacter.includes("fubuki")) {
            body.style.backgroundImage = `url(/fubuki.png)`;
        }else if (selectedCharacter.includes("aqua")) {
            body.style.backgroundImage = `url(/aqua.png)`;
        }
        else {
            body.style.backgroundImage = `url(/${selectedCharacter}.png)`;
        }
    }, [selectedCharacter]);

    const handleResetSystemPrompt = () => {
        setIsVideoPlaying(true);
    };

    const handleVideoEnded = () => {
        setIsVideoPlaying(false);
    };

    const characterOptions = [
        { value: "default", label: "캐릭터를 선택해주세요", image: "/default.png" },
        { value: "miko_1st", label: "사쿠라 미코(1세대)", image: "/miko_1st.png" },
        { value: "miko_miko", label: "사쿠라 미코(무녀)", image: "/miko_miko.png" },
        { value: "miko_3rd", label: "사쿠라 미코(3세대)", image: "/miko_3rd.png" },
        { value: "pekora", label: "우사다 페코라", image: "/pekora.png" },
        { value: "fubuki", label: "시라카미 후부키", image: "/fubuki.png" },
        { value: "fubuki_bunny", label: "시라카미 후부키(버니)", image: "/fubuki_bunny.png" },
        { value: "aqua_made", label: "미나토 아쿠아(메이드)", image: "/aqua_made.png" },
        { value: "aqua", label: "미나토 아쿠아(사복)", image: "/aqua.png" },
        { value: "koyori", label: "하쿠이 코요리", image: "/koyori.png" },
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
                                style={{ backgroundImage: `url(${characterOptions.find(option => option.value === selectedCharacter)?.image})`, backgroundSize: '24px', backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat' }}
                            >
                                {characterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
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
                                <TextButton onClick={onClickResetChatLog}>채팅 내역 초기화</TextButton>
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

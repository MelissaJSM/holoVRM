import {IconButton} from "./iconButton";
import {Message} from "@/features/messages/messages";
import {CharacterVoiceParam} from "@/features/constants/characterVoiceParam";
import {KoeiroParam} from "@/features/constants/koeiroParam";
import {ChatLog} from "./chatLog";
import React, {useCallback, useContext, useRef, useState, useEffect} from "react";
import {Settings} from "./settings";
import {ViewerContext} from "@/features/vrmViewer/viewerContext";
import {AssistantText} from "./assistantText";

type Props = {
    openAiKey: string,
    systemPrompt: string,
    chatLog: Message[],
    characterVoiceParam: CharacterVoiceParam,
    koeiroParam: KoeiroParam,
    assistantMessage: string,
    onChangeSystemPrompt: (systemPrompt: string) => void,
    onChangeAiKey: (key: string) => void,
    onChangeChatLog: (index: number, text: string) => void,
    onChangeCharacterVoiceParam: (param: CharacterVoiceParam) => void,
    onChangeKoeiroParam: (param: KoeiroParam) => void,
    handleClickResetChatLog: () => void,
    handleClickResetSystemPrompt: () => void,
    onOpenSettings: () => void,
    userId: string,
    showAssistantMessage: boolean,
    summary: string,
    setSummary: React.Dispatch<React.SetStateAction<string>>,
    lastCharacter?: string,
    loadParams: (inputUserId: string) => void, // <--- 여기에 loadParams 추가
};

export const Menu = ({
                         openAiKey,
                         systemPrompt,
                         chatLog,
                         characterVoiceParam,
                         koeiroParam,
                         assistantMessage,
                         onChangeSystemPrompt,
                         onChangeAiKey,
                         onChangeChatLog,
                         onChangeCharacterVoiceParam,
                         onChangeKoeiroParam,
                         handleClickResetChatLog,
                         handleClickResetSystemPrompt,
                         onOpenSettings,
                         userId,
                         showAssistantMessage,
                         summary,
                         setSummary,
                         lastCharacter,
                         loadParams, // <--- 여기에 loadParams 추가

                     }: Props) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showChatLog, setShowChatLog] = useState(false);
    const {viewer} = useContext(ViewerContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChangeSystemPrompt = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChangeSystemPrompt(event.target.value);
        },
        [onChangeSystemPrompt]
    );

    const handleAiKeyChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onChangeAiKey(event.target.value);
        },
        [onChangeAiKey]
    );


    const handleCharacterVoiceChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            onChangeCharacterVoiceParam({
                voiceId: event.target.value
            });
        },
        [onChangeCharacterVoiceParam]
    );

    const handleChangeKoeiroParam = useCallback(
        (x: number, y: number) => {
            onChangeKoeiroParam({
                speakerX: x,
                speakerY: y,
            });
        },
        [onChangeKoeiroParam]
    );

    const handleClickOpenVrmFile = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleChangeVrmFile = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files) return;

            const file = files[0];
            if (!file) return;

            const file_type = file.name.split(".").pop();

            if (file_type === "vrm") {
                const blob = new Blob([file], {type: "application/octet-stream"});
                const url = window.URL.createObjectURL(blob);
                viewer.loadVrm(url);
            }

            event.target.value = "";
        },
        [viewer]
    );

    // 추가된 부분: prop에서 설정 창 열기 함수 실행
    useEffect(() => {
        if (onOpenSettings) {
            onOpenSettings();
            setShowSettings(true);
        }
    }, [onOpenSettings]);

    return (
        <>
            <div className="absolute z-10 m-24">
                <div className="grid grid-flow-col gap-[8px]">
                    <IconButton
                        iconName="24/Menu"
                        label="Settings"
                        isProcessing={false}
                        onClick={() => setShowSettings(true)}
                        style={{
                            backgroundColor: '#856292',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            transition: 'background-color 0.3s ease, transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6b4f7d'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#856292'}
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor = '#593c66';
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = '#6b4f7d';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    />
                    {showChatLog ? (
                        <IconButton
                            iconName="24/CommentOutline"
                            label="Conversation Log"
                            isProcessing={false}
                            onClick={() => setShowChatLog(false)}
                            style={{
                                backgroundColor: '#856292',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                transition: 'background-color 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6b4f7d'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#856292'}
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = '#593c66';
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = '#6b4f7d';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                    ) : (
                        <IconButton
                            iconName="24/CommentFill"
                            label="Conversation Log"
                            isProcessing={false}
                            disabled={chatLog.length <= 0}
                            onClick={() => setShowChatLog(true)}
                            style={{
                                backgroundColor: '#856292',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                opacity: chatLog.length <= 0 ? 0.5 : 1, // 반투명 처리
                                transition: 'background-color 0.3s ease, transform 0.2s ease, opacity 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6b4f7d'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#856292'}
                            onMouseDown={(e) => {
                                e.currentTarget.style.backgroundColor = '#593c66';
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor = '#6b4f7d';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                    )}
                </div>
            </div>

            {showChatLog && <ChatLog messages={chatLog}/>}
            {showSettings && (
                <Settings
                    openAiKey={openAiKey}
                    characterVoiceParam={characterVoiceParam}
                    chatLog={chatLog}
                    systemPrompt={systemPrompt}
                    koeiroParam={koeiroParam}
                    onClickClose={() => setShowSettings(false)}
                    onChangeAiKey={handleAiKeyChange}
                    onChangeCharacterVoice={handleCharacterVoiceChange}
                    onChangeSystemPrompt={handleChangeSystemPrompt}
                    onChangeChatLog={onChangeChatLog}
                    onChangeKoeiroParam={handleChangeKoeiroParam}
                    onClickOpenVrmFile={handleClickOpenVrmFile}
                    onClickResetChatLog={handleClickResetChatLog}
                    onClickResetSystemPrompt={handleClickResetSystemPrompt}
                    userId={userId} // 추가된 부분
                    summary={summary} // 추가된 부분
                    setSummary={setSummary} // 추가된 부분
                    lastCharacter={lastCharacter} // 추가된 부분
                    loadParams={loadParams}  // <--- 여기에 loadParams 추가

                />
            )}
            {!showChatLog && showAssistantMessage && assistantMessage && (
                <AssistantText message={assistantMessage}/>
            )}
            <input
                type="file"
                className="hidden"
                accept=".vrm"
                ref={fileInputRef}
                onChange={handleChangeVrmFile}
            />
        </>
    );
};

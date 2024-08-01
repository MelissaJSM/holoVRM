import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Message, textsToScreenplay, Screenplay } from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_KOEIRO_PARAM } from "@/features/constants/koeiroParam";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { Meta } from "@/components/meta";
import { GitHubLink } from "@/components/githubLink";

import { CharacterVoiceParam, DEFAULT_CHARACTER_VOICE_PARAM } from "@/features/constants/characterVoiceParam";
import characterPrompts, { CharacterPrompts } from "@/features/constants/prompts";

import { M_PLUS_2, Montserrat } from 'next/font/google';

const m_plus_2 = M_PLUS_2({ variable: "--font-m-plus-2", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], display: "swap" });


export default function Home() {
    const { viewer } = useContext(ViewerContext);

    const [userId, setUserId] = useState("");
    const [lastCharacter, setLastCharacter] = useState<string | undefined>(undefined);
    const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
    const [openAiKey, setOpenAiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_KEY || "");
    const [characterVoiceParam, setCharacterVoiceParam] = useState<CharacterVoiceParam>(DEFAULT_CHARACTER_VOICE_PARAM);
    const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_KOEIRO_PARAM);
    const [chatProcessing, setChatProcessing] = useState(false);
    const [chatLog, setChatLog] = useState<Message[]>([]);
    const [assistantMessage, setAssistantMessage] = useState("");
    const [summary, setSummary] = useState("");
    const [showIntro, setShowIntro] = useState(true);
    const [, setShowSettings] = useState(false);
    const [showAssistantMessage, setShowAssistantMessage] = useState(true);

    const easterEgg = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡐⠀⠀⠀⠀⠀⠀⠀⠀⠄⠠⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢈⠐⡡⠀⠀⠀⠀⠀⡀⠌⡀⢃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⢐⠠⠂⣄⠀⠀⠀⠠⠐⡨⢀⠸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡆⠊⠈⠀⢐⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠄⡌⡢⠀⠄⠀⠀⡀⠀⠑⠄⡃⠀⠀⠀⠀⠀⠀⠀⠀⢔⠨⡢⣉⠖⡉⢕⠒⢤⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⢀⠈⢂⠅⠀⠠⠁⠠⢀⡒⢀⠀⠀⠀⠀⠀⢀⢐⠕⡡⢎⠔⡕⢨⠊⡔⡩⠢⡑⢕⣀⢀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⡀⠂⠀⡔⢁⠀⠄⠠⡀⡈⠐⠅⠠⡀⠀⠀⣄⠇⡱⡱⡨⡊⢜⢄⢣⡳⢈⣆⢙⡇⠧⣱⠉⢤⡂⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡌⡐⠀⡎⡀⠔⡀⠕⡐⠠⠘⠌⡌⠆⢐⠄⢰⠌⠼⠁⡊⠐⡣⢒⠤⠃⠳⡑⠲⡄⢫⢗⢬⡫⢳⠜⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⡸⠰⡄⢪⠰⠁⡢⢕⠈⢥⢅⠑⡜⣀⠚⣀⠗⢊⣎⠊⠑⠲⠄⠘⠢⠓⡷⢤⡉⡎⣘⠜⣅⢺⢜⢄⠗⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠠⡎⢣⠆⡇⠠⢚⢠⠡⠈⡇⢠⠐⠥⢃⣌⡆⠅⡼⣹⡤⠄⢂⠀⡀⠀⢀⠁⠌⠀⠁⢞⢤⢫⡪⡳⡡⢊⢆⢅⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⡀⢫⡐⡇⢘⠘⡌⣀⡐⣄⡑⠀⠈⡋⠖⠘⡅⢘⠓⠷⢂⡀⠀⠈⠀⠀⠐⠀⢀⠂⡦⡜⡠⠳⡱⠈⡢⡃⠜⠄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⡄⢁⠎⢘⠆⠐⡱⠈⢀⠀⠀⠀⠀⠀⠀⠠⢀⠇⢂⠀⠀⡠⣏⡛⢒⠴⢢⢖⢖⠙⠩⡞⡔⡸⡐⢽⢀⠵⡨⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠠⡑⠄⠰⢂⠊⠊⢠⠊⣄⢀⠌⠈⠈⠂⢊⡠⠐⠁⣇⠠⠀⠈⡲⠪⡠⠛⠸⠃⠁⠀⠈⠀⠓⡵⡈⠺⣄⠣⡊⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢆⢰⠁⠁⠀⠀⠆⠄⠠⠀⠀⠄⡀⠀⣱⠀⠐⠄⡒⡐⠀⣄⡱⡘⣮⢀⠄⠁⠀⠀⢀⠀⡙⣎⢝⠔⡡⡫⠐⢢⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠌⠀⡖⢉⠀⠀⠀⠈⣕⠈⠒⠐⠄⡠⢑⠜⠀⢄⠠⠀⠉⠂⠄⠉⣉⢖⢣⢦⠄⣃⢊⠀⠀⢜⠌⡮⢳⢌⠢⢣⠀⠉⡆⡀⠀
⠀⠀⠀⠀⠀⡊⢦⡈⠃⠀⠀⠀⠀⠀⠁⠅⠀⠠⡀⢁⠇⢒⠈⠤⠁⢌⠀⢃⠘⢔⠩⠓⠤⡔⠈⢆⠄⠀⡹⡂⡃⠈⠑⢧⡑⡩⡂⠎⠂⠀
⠀⣠⣄⣠⠚⡤⢢⡂⣔⢠⠀⠀⠀⠀⢈⠂⣏⠆⠡⢰⠃⡈⢈⠂⠡⠀⠜⣠⢁⢖⢁⠦⢸⠁⣀⡨⠲⠄⢚⢜⠣⣄⡀⠠⠇⠐⠕⠀⠀⠀
⠀⢸⢆⢺⢔⢬⢢⠋⢄⠇⠁⠀⠀⢀⠄⠁⠀⠀⠀⠐⡇⠀⠂⡌⢐⢁⠜⠀⠂⠂⢣⠐⡀⡱⠅⠤⡠⠀⣋⠈⠃⢶⡹⠈⠀⠀⠁⠀⠀⠀
    "페코미코는 존재하니 믿을지어다. - 멜리사J"`;

    useEffect(() => {
        console.log(easterEgg);
    }, []);

    const resetChatLog = useCallback(() => {
        setChatLog([]);
        setSummary("");
        const storageKey = `chatVRMParams_${userId}`;
        if (userId.startsWith("session_")) {
            sessionStorage.removeItem(storageKey);
        } else {
            window.localStorage.removeItem(storageKey);
        }
    }, [userId]);

    const handleUserIdSubmit = useCallback((inputUserId: string, isSession: boolean, lastCharacter?: string) => {
        setUserId(inputUserId);
        setLastCharacter(lastCharacter); // lastCharacter 설정
        setShowIntro(false); // 인트로 화면 숨기기
        if (!isSession) {
            loadParams(inputUserId); // userId가 설정된 후에 호출
        }
    }, []);


    const openSettings = useCallback(() => {
        setShowIntro(false);
        setShowSettings(true);
    }, []);

    const loadParams = async (inputUserId: string) => {
        const response = await fetch('/api/chat?userId=' + inputUserId);
        const data = await response.json();
        if (data.success) {
            const logs = data.chatLogs.map((log: { role: string; message: string }) => ({
                role: log.role,
                content: log.message // message를 content로 변환
            }));
            setChatLog(logs);
        }
    };


    const loadDefaultParams = () => {
        setSystemPrompt(SYSTEM_PROMPT);
        setCharacterVoiceParam(DEFAULT_CHARACTER_VOICE_PARAM);
        setChatLog([]);
        setSummary("");
        setCharacter("default");
    };

    useEffect(() => {
        if (userId) {
            if (userId.startsWith("session_")) {
                loadDefaultParams();
            } else {
                loadParams(userId);
            }
        }
    }, [userId]);

    const setCharacter = (character: keyof CharacterPrompts | "default") => {
        if (character === "default") {
            document.body.style.backgroundImage = "";
            setCharacterVoiceParam((prev) => ({ ...prev, voiceId: "" }));
            setSystemPrompt(SYSTEM_PROMPT);
            console.log("Character set to default");
        } else {
            const backgroundImageUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;
            document.body.style.backgroundImage = `url(${backgroundImageUrl}background/${character}.png)`; // 여기 안쓰는거아냐?
            setCharacterVoiceParam((prev) => ({ ...prev, voiceId: character }));
            setSystemPrompt(characterPrompts[character]);
            console.log("Character set to:", character, "Prompt:", characterPrompts[character]);
        }

        if (!character.includes("default")) {
            window.dispatchEvent(new CustomEvent("changeAvatar", { detail: character }));
        }
    };

    const handleChangeChatLog = useCallback(
        (targetIndex: number, text: string) => {
            const newChatLog = chatLog.map((v: Message, i) => {
                return i === targetIndex ? { ...v, content: text } : v;
            });

            setChatLog(newChatLog);
        },
        [chatLog]
    );

    const handleSpeakAi = useCallback(
        async (
            screenplay: Screenplay,
            characterVoiceParam: CharacterVoiceParam,
            onStart?: () => void,
            onEnd?: () => void,
            audioBuffer?: ArrayBuffer
        ) => {
            speakCharacter(screenplay, characterVoiceParam, viewer, onStart, () => {
                if (onEnd) onEnd();
                setTimeout(() => {
                    setShowAssistantMessage(false);
                }, 5000);
            }, audioBuffer);
            console.log('speak character');
        },
        [viewer]
    );

    const getGpt4Response = async (messages: Message[], openAiKey: string, isSession: boolean) => {
        const model = isSession ? "gpt-4o-mini" : "gpt-4o";
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model,
                messages: messages,
                max_tokens: 2000
            })
        });
        const data = await response.json();
        console.log("OpenAI Response:", data);
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }
        throw new Error("Invalid response from OpenAI API");
    };

    const summarizeChat = async (recentMessages: Message[], openAiKey: string, isSession: boolean) => {
        const summaryPrompt: Message = {
            role: "system",
            content: "다음 대화를 요약해 주세요."
        };
        const summaryMessages = [summaryPrompt, ...recentMessages];
        const summaryResponse = await getGpt4Response(summaryMessages, openAiKey, isSession);
        console.log("Summary Response:", summaryResponse);
        return summaryResponse;
    };

    const handleSendChat = useCallback(
        async (text: string) => {
            const newMessage: Message = { role: "user", content: text };

            if (newMessage == null) return;

            setChatProcessing(true);

            let messageLog: Message[] = [
                { role: "system", content: systemPrompt },
            ];

            if (summary) {
                messageLog.push({
                    role: "system",
                    content: `이전 대화 요약: ${summary}`
                });
            }

            messageLog = [
                ...messageLog,
                ...chatLog,
                newMessage,
            ];

            setChatLog(prev => [...prev, newMessage]);

            try {
                const gptResponse = await getGpt4Response(messageLog, openAiKey, userId.startsWith("session_"));

                const newAssistantMessage: Message = { role: "assistant", content: gptResponse };
                setChatLog(prev => [...prev, newAssistantMessage]);

                const recentMessages = [newMessage, newAssistantMessage];
                const chatSummary = await summarizeChat(recentMessages, openAiKey, userId.startsWith("session_"));
                setSummary(prevSummary => `${prevSummary} ${chatSummary}`);

                const screenplays = textsToScreenplay([gptResponse], koeiroParam);
                const screenplay = screenplays[0];

                let character;

                if ((characterVoiceParam.voiceId).includes("miko")) {
                    character = "miko_1st";
                } else if ((characterVoiceParam.voiceId).includes("fubuki")) {
                    character = "fubuki";
                } else if ((characterVoiceParam.voiceId).includes("aqua")) {
                    character = "aqua";
                } else if ((characterVoiceParam.voiceId).includes("koyori")) {
                    character = "koyori";
                } else if ((characterVoiceParam.voiceId).includes("pekomama")) {
                    character = "pekomama";
                }
                else {
                    character = characterVoiceParam.voiceId || "miko";
                }

                const ttsEndpoint = process.env.NEXT_PUBLIC_TTS_SERVER;
                const response = await fetch(`${ttsEndpoint}/tts`, {
                    //const response = await fetch(`http://localhost:3545/tts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: screenplay.talk.message,
                        character: character
                    }),
                }).then(res => res.blob());

                if (!response) {
                    setAssistantMessage("오디오 생성에 실패했습니다.");
                    setChatProcessing(false);
                    return;
                }

                const audioBuffer = await response.arrayBuffer();

                handleSpeakAi(screenplay, characterVoiceParam, () => {
                    setAssistantMessage(gptResponse);
                    setShowAssistantMessage(true);
                }, undefined, audioBuffer);

                if (userId && !userId.startsWith("session_")) {
                    await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            userId,
                            role: 'user',
                            message: text
                        }),
                    });

                    await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            userId,
                            role: 'assistant',
                            message: gptResponse
                        }),
                    });

                    await fetch('/api/characterLog', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            userId,
                            character,
                            message: gptResponse
                        }),
                    });
                } else if (userId && userId.startsWith("session_")) {
                    await fetch('/api/characterLog', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId: userId,
                            character,
                            message: gptResponse
                        }),
                    });
                }

            } catch (error) {
                console.error("Error sending chat:", error);
            } finally {
                setChatProcessing(false);
            }
        },
        [chatLog,  characterVoiceParam, handleSpeakAi, koeiroParam, openAiKey, summary, systemPrompt, userId]
    );

    return (
        <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
            <Meta />
            {showIntro ? (
                <Introduction
                    openAiKey={openAiKey}
                    onChangeAiKey={setOpenAiKey}
                    onSubmitUserId={handleUserIdSubmit}
                    onResetChatLog={resetChatLog}
                    onOpenSettings={openSettings}
                />
            ) : (
                <>
                    <VrmViewer />
                    <MessageInputContainer
                        isChatProcessing={chatProcessing}
                        onChatProcessStart={handleSendChat}
                    />
                    <Menu
                        openAiKey={openAiKey}
                        systemPrompt={systemPrompt}
                        chatLog={chatLog}
                        characterVoiceParam={characterVoiceParam}
                        koeiroParam={koeiroParam}
                        assistantMessage={assistantMessage}
                        onChangeAiKey={setOpenAiKey}
                        onChangeSystemPrompt={setSystemPrompt}
                        onChangeChatLog={handleChangeChatLog}
                        onChangeCharacterVoiceParam={setCharacterVoiceParam}
                        onChangeKoeiroParam={setKoeiroParam}
                        handleClickResetChatLog={resetChatLog}
                        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
                        onOpenSettings={openSettings}
                        userId={userId}
                        summary={summary}
                        setSummary={setSummary}
                        showAssistantMessage={showAssistantMessage}
                        lastCharacter={lastCharacter}
                    />
                    <GitHubLink />
                </>
            )}
        </div>
    );
}

import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Message, textsToScreenplay, Screenplay } from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_KOEIRO_PARAM } from "@/features/constants/koeiroParam";
import { M_PLUS_2, Montserrat } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { Meta } from "@/components/meta";
import { GitHubLink } from "@/components/githubLink";

import { ElevenLabsParam, DEFAULT_ELEVEN_LABS_PARAM } from "@/features/constants/elevenLabsParam";
import characterPrompts, { CharacterPrompts } from "@/features/constants/prompts"; // 타입과 기본 내보내기 import

const m_plus_2 = M_PLUS_2({ variable: "--font-m-plus-2", display: "swap", preload: false });
const montserrat = Montserrat({ variable: "--font-montserrat", display: "swap", subsets: ["latin"] });


const easterEgg = `
// 생략된 내용
`;

export default function Home() {
    const { viewer } = useContext(ViewerContext);

    const [userId, setUserId] = useState("");
    const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
    const [openAiKey, setOpenAiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_KEY || "");
    const [elevenLabsKey, setElevenLabsKey] = useState(process.env.NEXT_PUBLIC_ELEVEN_LABS_KEY || "");
    const [elevenLabsParam, setElevenLabsParam] = useState<ElevenLabsParam>(DEFAULT_ELEVEN_LABS_PARAM);
    const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_KOEIRO_PARAM);
    const [chatProcessing, setChatProcessing] = useState(false);
    const [chatLog, setChatLog] = useState<Message[]>([]);
    const [assistantMessage, setAssistantMessage] = useState("");
    const [summary, setSummary] = useState("");
    const [showIntro, setShowIntro] = useState(true); // 인트로 화면 표시 여부
    const [showSettings, setShowSettings] = useState(false); // 설정 창 표시 여부
    const [showAssistantMessage, setShowAssistantMessage] = useState(true); // 대화창 표시 여부

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

    const handleUserIdSubmit = useCallback((inputUserId: string, isSession: boolean) => {
        setUserId(inputUserId);
        setShowIntro(false); // 인트로 화면 숨기기
    }, []);

    const openSettings = useCallback(() => {
        setShowIntro(false);
        setShowSettings(true);
    }, []);

    useEffect(() => {
        if (userId) {
            if (userId.startsWith("session_")) {
                loadDefaultParams();
            } else {
                loadParams();
            }
        }
    }, [userId]);

    const loadParams = () => {
        const savedParams = window.localStorage.getItem(`chatVRMParams_${userId}`);
        if (savedParams) {
            const params = JSON.parse(savedParams);
            setSystemPrompt(params.systemPrompt);
            setElevenLabsParam(params.elevenLabsParam);
            setChatLog(params.chatLog);
            setSummary(params.summary || "");
            setCharacter(params.elevenLabsParam.voiceId as keyof CharacterPrompts);
        } else {
            setCharacter("default");
        }
    };

    const loadDefaultParams = () => {
        setSystemPrompt(SYSTEM_PROMPT);
        setElevenLabsParam(DEFAULT_ELEVEN_LABS_PARAM);
        setChatLog([]);
        setSummary("");
        setCharacter("default");
    };

    useEffect(() => {
        if (userId.startsWith("session_")) {
            process.nextTick(() => {
                sessionStorage.setItem(
                    `chatVRMParams_${userId}`,
                    JSON.stringify({ systemPrompt, elevenLabsParam, chatLog, summary })
                );
            });
        } else if (userId) {
            process.nextTick(() => {
                window.localStorage.setItem(
                    `chatVRMParams_${userId}`,
                    JSON.stringify({ systemPrompt, elevenLabsParam, chatLog, summary })
                );
            });
        }
    }, [systemPrompt, elevenLabsParam, chatLog, summary, userId]);

    const setCharacter = (character: keyof CharacterPrompts | "default") => {
        if (character === "default") {
            document.body.style.backgroundImage = "";
            setElevenLabsParam((prev) => ({ ...prev, voiceId: "" }));
            setSystemPrompt(SYSTEM_PROMPT);
            console.log("Character set to default");
        } else if (character.includes("miko")) {
            document.body.style.backgroundImage = `url(/miko_1st.png)`;
            setElevenLabsParam((prev) => ({ ...prev, voiceId: character }));
            setSystemPrompt(characterPrompts["miko_1st"]);
            console.log("Character set to:", "miko", "Prompt:", characterPrompts["miko_1st"]);
        } else if (character.includes("fubuki")) {
            document.body.style.backgroundImage = `url(/fubuki.png)`;
            setElevenLabsParam((prev) => ({ ...prev, voiceId: character }));
            setSystemPrompt(characterPrompts["fubuki"]);
            console.log("Character set to:", "fubuki", "Prompt:", characterPrompts["fubuki"]);
        } else if (character.includes("aqua")) {
            document.body.style.backgroundImage = `url(/aqua.png)`;
            setElevenLabsParam((prev) => ({ ...prev, voiceId: character }));
            setSystemPrompt(characterPrompts["aqua"]);
            console.log("Character set to:", "aqua", "Prompt:", characterPrompts["aqua"]);
        } else if (character.includes("koyori")) {
            document.body.style.backgroundImage = `url(/koyori.png)`;
            setElevenLabsParam((prev) => ({ ...prev, voiceId: character }));
            setSystemPrompt(characterPrompts["koyori"]);
            console.log("Character set to:", "koyori", "Prompt:", characterPrompts["koyori"]);
        } else {
            document.body.style.backgroundImage = `url(/${character}.png)`;
            setElevenLabsParam((prev) => ({ ...prev, voiceId: character }));
            setSystemPrompt(characterPrompts[character]);
            console.log("Character set to:", character, "Prompt:", characterPrompts[character]);
        }

        // 캐릭터 변경 이벤트 트리거
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
            elevenLabsKey: string,
            elevenLabsParam: ElevenLabsParam,
            onStart?: () => void,
            onEnd?: () => void,
            audioBuffer?: ArrayBuffer
        ) => {
            speakCharacter(screenplay, elevenLabsKey, elevenLabsParam, viewer, onStart, () => {
                if (onEnd) onEnd();
                setTimeout(() => {
                    setShowAssistantMessage(false);
                }, 5000); // 5초 뒤에 대화창 숨기기
            }, audioBuffer);
            console.log('speak character');
        },
        [viewer]
    );

    const getGpt4Response = async (messages: Message[], openAiKey: string) => {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
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

    const summarizeChat = async (recentMessages: Message[], openAiKey: string) => {
        const summaryPrompt: Message = {
            role: "system",
            content: "다음 대화를 요약해 주세요."
        };
        const summaryMessages = [summaryPrompt, ...recentMessages];
        const summaryResponse = await getGpt4Response(summaryMessages, openAiKey);
        console.log("Summary Response:", summaryResponse); // 요약 내용을 콘솔에 출력
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
                const gptResponse = await getGpt4Response(messageLog, openAiKey);

                const newAssistantMessage: Message = { role: "assistant", content: gptResponse };
                const updatedMessageLog = [...chatLog, newAssistantMessage];
                setChatLog(prev => [...prev, newAssistantMessage]);

                const recentMessages = [newMessage, newAssistantMessage];
                const chatSummary = await summarizeChat(recentMessages, openAiKey);
                setSummary(prevSummary => `${prevSummary} ${chatSummary}`);
                console.log("Chat Summary:", chatSummary); // 요약 내용을 콘솔에 출력

                const screenplays = textsToScreenplay([gptResponse], koeiroParam);
                const screenplay = screenplays[0];

                console.log("Emotion:", screenplay.expression);
                console.log("Message:", screenplay.talk.message);

                let character;

                if ((elevenLabsParam.voiceId).includes("miko")) {
                    character = "miko_1st";
                } else if ((elevenLabsParam.voiceId).includes("fubuki")) {
                    character = "fubuki";
                } else if ((elevenLabsParam.voiceId).includes("aqua")) {
                    character = "aqua";
                } else if ((elevenLabsParam.voiceId).includes("koyori")) {
                    character = "koyori";
                } else {
                    character = elevenLabsParam.voiceId || "miko";
                }
                const ttsEndpoint = process.env.NEXT_PUBLIC_TTS_SERVER;
                //const response = await fetch(`${ttsEndpoint}/tts`, {
                     const response = await fetch(`http://localhost:3545/tts`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
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

                handleSpeakAi(screenplay, elevenLabsKey, elevenLabsParam, () => {
                    setAssistantMessage(gptResponse);
                    setShowAssistantMessage(true); // 대화창을 다시 표시
                }, undefined, audioBuffer);
            } catch (error) {
                console.error("Error sending chat:", error);
            } finally {
                setChatProcessing(false);
            }
        },
        [chatLog, elevenLabsKey, elevenLabsParam, handleSpeakAi, koeiroParam, openAiKey, summary, systemPrompt]
    );

    return (
        <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
            <Meta />
            {showIntro ? (
                <Introduction
                    openAiKey={openAiKey}
                    elevenLabsKey={elevenLabsKey}
                    onChangeAiKey={setOpenAiKey}
                    onChangeElevenLabsKey={setElevenLabsKey}
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
                        elevenLabsKey={elevenLabsKey}
                        systemPrompt={systemPrompt}
                        chatLog={chatLog}
                        elevenLabsParam={elevenLabsParam}
                        koeiroParam={koeiroParam}
                        assistantMessage={assistantMessage}
                        onChangeAiKey={setOpenAiKey}
                        onChangeElevenLabsKey={setElevenLabsKey}
                        onChangeSystemPrompt={setSystemPrompt}
                        onChangeChatLog={handleChangeChatLog}
                        onChangeElevenLabsParam={setElevenLabsParam}
                        onChangeKoeiromapParam={setKoeiroParam}
                        handleClickResetChatLog={resetChatLog}
                        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
                        onOpenSettings={openSettings}
                        userId={userId} // 추가된 부분
                        showAssistantMessage={showAssistantMessage} // 추가된 부분
                    />
                    <GitHubLink />
                </>
            )}
        </div>
    );
}

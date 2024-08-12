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
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⢐⠠⠂⣄⠀⠀⠀⠠⠐⡨⢀⠸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡆⠊⠈⠀⢐⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀
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

    //이게 불러오기란건데
    const loadParams = async (inputUserId: string) => {

        console.log("loadparams 진입");

        if (userId.startsWith("session_")) {
            console.log("loadparams 세션 진입");
            let character_degree = sessionStorage.getItem('character_degree');
            const response = await fetch(`/api/chat-session?character_degree=${character_degree}`);
            const data = await response.json();

            if (data.success) {
                console.log("loadparams 성공");

                const logs = data.chatLogs.map((log: { role: string; message: string }) => ({
                    role: log.role,
                    content: log.message, // message를 content로 변환
                }));

                setChatLog(logs);
            }
        }
        else {
            console.log("loadparams 일반 진입");
            let character_degree = sessionStorage.getItem('character_degree');
            const response = await fetch('/api/chat?userId=' + inputUserId + "&character_degree=" + character_degree);
            const data = await response.json();
            if (data.success) {
                console.log("loadparams 성공");

                const logs = data.chatLogs.map((log: { role: string; message: string }) => ({
                    role: log.role,
                    content: log.message // message를 content로 변환
                }));
                setChatLog(logs);
            }
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
    //////////////////////////////////////////////////
    const getEmoteResponse = async (text: string): Promise<{ [key: string]: number } | { error: string } & { translatedText?: string }> => {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error:', errorText);
                return { error: errorText };
            }

            const data = await response.json();
            console.log(`Translated text: ${data.translatedText}`);
            return data;
        } catch (error) {
            console.error('Error:', error);
            if (error instanceof Error) {
                return { error: error.message };
            } else {
                return { error: 'Unknown error occurred' };
            }
        }
    };


    /////////////////////////////////////////////////

    const getGpt4Response = async (messages: Message[], openAiKey: string, isSession: boolean) => {
        const model = isSession ? "gpt-4o-mini" : "gpt-4o-2024-08-06";
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
        const summaryResponse = await getGpt4Response(summaryMessages, openAiKey, isSession); // 요약용
        console.log("Summary Response:", summaryResponse);
        return summaryResponse;
    };



    const handleSendChat = useCallback(
        async (text: string) => {

            setChatProcessing(true);
            let emoteText = '';

            if(userId.startsWith("session_")){
                emoteText="";

                //여기에 비활성화 상태라는 기능을 추가하도록 한다.

            }
            else{
                // 여기서 text 변수를 사용해서 값을 이용해야겠네.
                const emoteResult = await getEmoteResponse(text);
                if ('error' in emoteResult) {
                    console.error('Error:', emoteResult.error);
                    //여기에 비활성화 상태라는 기능을 추가하도록 한다.
                } else {
                    console.log('Emotion analysis result:', emoteResult);
                    emoteText = `아래 설명하는 감정 수치는 지금 대화를 IBM Watson Natural Language Understanding을 통해 분석한 것입니다.
                감정 수치는 0에서 1.0까지의 범위를 가지며, 값이 1.0에 가까울수록 해당 감정이 강하다는 것을 의미합니다.
                이 자료를 참고하여 사용자의 감정 상태를 이해하고 대화에 반영해 주시기 바랍니다.
                감정 수치: ${JSON.stringify(emoteResult)})`;
                }
            }



            const newMessage: Message = { role: "user", content: text };

            if (newMessage == null) return;

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
                const gptMessages = messageLog.map((msg, index) => {
                    if (index === messageLog.length - 1) {
                        return { ...msg, content: msg.content + emoteText };
                    }
                    return msg;
                });

                console.log("Sending messages to GPT:", gptMessages);

                const gptResponse = await getGpt4Response(gptMessages, openAiKey, userId.startsWith("session_")); // 대화용

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
                } else if ((characterVoiceParam.voiceId).includes("mio")) {
                    character = "mio";
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

                let character_degree = sessionStorage.getItem('character_degree');
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
                            message: text,
                            character_degree
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
                            message: gptResponse,
                            character_degree
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


                    await fetch('/api/chat-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            role: 'user',
                            message: text,
                            character_degree,
                        }),
                    });

                    await fetch('/api/chat-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            role: 'assistant',
                            message: gptResponse,
                            character_degree,
                        }),
                    });


                    await fetch('/api/characterLog', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId: userId,
                            character,
                            message: gptResponse,
                        }),
                    });
                }

            } catch (error) {
                console.error("Error sending chat:", error);
            } finally {
                setChatProcessing(false);
            }
        },
        [chatLog, characterVoiceParam, handleSpeakAi, koeiroParam, openAiKey, summary, systemPrompt, userId]
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
                        loadParams={loadParams}  // loadParams 함수 전달

                    />
                    <GitHubLink />
                </>
            )}
        </div>
    );
}

import React, { useState, useEffect, useCallback } from "react";
import { MessageInput } from "@/components/messageInput";
import ToggleButton from "@/components/ToggleButton";

type Props = {
    isChatProcessing: boolean;
    onChatProcessStart: (text: string) => void;
    onEmotionAnalysisToggle: (enabled: boolean) => void;
    isEmotionAnalysisEnabled: boolean;
    shouldShowEmotionToggle: boolean; // 버튼을 표시할지 여부
};

export const MessageInputContainer = ({
                                          isChatProcessing,
                                          onChatProcessStart,
                                          onEmotionAnalysisToggle,
                                          isEmotionAnalysisEnabled,
                                          shouldShowEmotionToggle,
                                      }: Props) => {
    const [userMessage, setUserMessage] = useState("");
    const [speechRecognition, setSpeechRecognition] =
        useState<SpeechRecognition>();
    const [isMicRecording, setIsMicRecording] = useState(false);

    const handleRecognitionResult = useCallback(
        (event: SpeechRecognitionEvent) => {
            const text = event.results[0][0].transcript;
            setUserMessage(text);

            if (event.results[0].isFinal) {
                setUserMessage(text);
                onChatProcessStart(text);
            }
        },
        [onChatProcessStart]
    );

    const handleRecognitionEnd = useCallback(() => {
        setIsMicRecording(false);
    }, []);

    const handleClickMicButton = useCallback(() => {
        if (isMicRecording) {
            speechRecognition?.abort();
            setIsMicRecording(false);
            return;
        }

        speechRecognition?.start();
        setIsMicRecording(true);
    }, [isMicRecording, speechRecognition]);

    const handleClickSendButton = useCallback(() => {
        onChatProcessStart(userMessage);
    }, [onChatProcessStart, userMessage]);

    const handleEmotionAnalysisToggle = () => {
        //console.log("버튼이 눌러졌습니다 : " + !isEmotionAnalysisEnabled);
        onEmotionAnalysisToggle(!isEmotionAnalysisEnabled);
    };

    useEffect(() => {
        const SpeechRecognition =
            window.webkitSpeechRecognition || window.SpeechRecognition;

        if (!SpeechRecognition) {
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "ko-KR";
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.addEventListener("result", handleRecognitionResult);
        recognition.addEventListener("end", handleRecognitionEnd);

        setSpeechRecognition(recognition);
    }, [handleRecognitionResult, handleRecognitionEnd]);

    useEffect(() => {
        if (!isChatProcessing) {
            setUserMessage("");
        }
    }, [isChatProcessing]);

    return (
        <div className="flex items-center">
            {shouldShowEmotionToggle && (
                <ToggleButton
                    latestSort={isEmotionAnalysisEnabled}
                    toggleHandler={handleEmotionAnalysisToggle}
                />
            )}
            <MessageInput
                userMessage={userMessage}
                isChatProcessing={isChatProcessing}
                isMicRecording={isMicRecording}
                onKeyDownUserMessage={(e) => {
                    if (e.key === "Enter") {
                        handleClickSendButton();
                    }
                }}
                onChangeUserMessage={(e) => setUserMessage(e.target.value)}
                onClickMicButton={handleClickMicButton}
                onClickSendButton={handleClickSendButton}
            />
        </div>
    );
};

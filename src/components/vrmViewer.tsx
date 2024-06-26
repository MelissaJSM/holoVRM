import { useContext, useCallback, useEffect, useState } from "react";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";

export default function VrmViewer() {
  const { viewer } = useContext(ViewerContext);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadAvatar = async (avatarName: string) => {
    if(!avatarName.includes("default")){
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_AVATAR_BASE_URL;
      const url = `${baseUrl}${avatarName}.vrm`;

      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const total = response.headers.get('content-length');
        const totalSize = total ? parseInt(total, 10) : 0;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader from response body');
        }

        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            chunks.push(value);
            receivedLength += value.length;
            setProgress((receivedLength / totalSize) * 100);
          }
        }

        const blob = new Blob(chunks, { type: "application/octet-stream" });
        const objectUrl = window.URL.createObjectURL(blob);
        viewer.loadVrm(objectUrl);
      } catch (error) {
        console.error('Failed to load VRM file:', error);
      } finally {
        setIsLoading(false);
        setProgress(0);
      }
    }

  };

  const canvasRef = useCallback(
      (canvas: HTMLCanvasElement) => {
        if (canvas) {
          viewer.setup(canvas);
          const savedParams = JSON.parse(window.localStorage.getItem("chatVRMParams") as string);
          const avatarName = savedParams?.elevenLabsParam?.voiceId || "AvatarSample_B";
          loadAvatar(avatarName);

          // Drag and Drop으로 VRM을 교체
          canvas.addEventListener("dragover", function (event) {
            event.preventDefault();
          });

          canvas.addEventListener("drop", function (event) {
            event.preventDefault();

            const files = event.dataTransfer?.files;
            if (!files) {
              return;
            }

            const file = files[0];
            if (!file) {
              return;
            }

            const file_type = file.name.split(".").pop();
            if (file_type === "vrm") {
              const blob = new Blob([file], { type: "application/octet-stream" });
              const url = window.URL.createObjectURL(blob);
              viewer.loadVrm(url);
            }
          });
        }
      },
      [viewer]
  );

  useEffect(() => {
    const handleAvatarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      loadAvatar(customEvent.detail);
    };

    window.addEventListener("changeAvatar", handleAvatarChange as EventListener);

    return () => {
      window.removeEventListener("changeAvatar", handleAvatarChange as EventListener);
    };
  }, [viewer]);

  return (
      <div className={"absolute top-0 left-0 w-screen h-[100svh] -z-10"}>
        <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
        {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="text-white mb-4">Loading...</div>
              <div className="w-1/2 bg-gray-200 rounded-full h-4">
                <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
        )}
      </div>
  );
}

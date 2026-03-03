import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ScreenCaptureState {
  stream: MediaStream | null;
  screenshotDataUrl?: string;
  previewRef: MutableRefObject<HTMLVideoElement | null>;
  error?: string;
  startShare: () => Promise<void>;
  stopShare: () => void;
  takeSnapshot: () => Promise<string | undefined>;
  uploadFile: (file: File) => Promise<string>;
}

async function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    const onLoaded = () => {
      video.removeEventListener("loadeddata", onLoaded);
      resolve();
    };
    video.addEventListener("loadeddata", onLoaded, { once: true });
  });
}

export function useScreenCapture(): ScreenCaptureState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const stopShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
  }, [stream]);

  const startShare = useCallback(async () => {
    setError(undefined);
    try {
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      });
      media.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          setStream(null);
        });
      });
      setStream(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start screen share");
    }
  }, []);

  const takeSnapshot = useCallback(async () => {
    const currentStream = stream;
    if (!currentStream) {
      return undefined;
    }

    const video = previewRef.current ?? document.createElement("video");
    if (!previewRef.current) {
      video.srcObject = currentStream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch {
        return undefined;
      }
    }

    try {
      await waitForVideoReady(video);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return undefined;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setScreenshotDataUrl(dataUrl);
      return dataUrl;
    } catch {
      return undefined;
    }
  }, [stream]);

  const uploadFile = useCallback(async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setScreenshotDataUrl(dataUrl);
    return dataUrl;
  }, []);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) {
      return;
    }

    if (!stream) {
      preview.srcObject = null;
      return;
    }

    preview.srcObject = stream;
    preview.muted = true;
    preview.playsInline = true;
    void preview.play().catch(() => {
      setError("Screen share started, but preview playback is blocked by browser policy.");
    });
  }, [stream]);

  return useMemo(
    () => ({
      stream,
      screenshotDataUrl,
      previewRef,
      error,
      startShare,
      stopShare,
      takeSnapshot,
      uploadFile
    }),
    [error, screenshotDataUrl, startShare, stopShare, stream, takeSnapshot, uploadFile]
  );
}

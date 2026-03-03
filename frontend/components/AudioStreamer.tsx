
import { useEffect, useRef, useState } from "react";
import { useRealtimeSession } from "../hooks/useRealtimeSession";

interface AudioStreamerProps {
  sessionId: string;
  enabled: boolean;
}

export function AudioStreamer({ sessionId, enabled }: AudioStreamerProps) {
  const { send, lastMessage } = useRealtimeSession(sessionId);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [error, setError] = useState<string>();

  // Audio Playback State
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const playAudioChunk = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        nextStartTimeRef.current = audioContextRef.current.currentTime;
      }

      const ctx = audioContextRef.current;
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Schedule playback to ensure gapless streaming
      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  // Handle incoming audio chunks from Mama
  useEffect(() => {
    if (lastMessage?.type === "MAMA_AUDIO" && lastMessage.payload?.audio) {
      playAudioChunk(lastMessage.payload.audio as string);
    }
  }, [lastMessage]);

  // Recording Logic
  useEffect(() => {
    if (!enabled) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        send("USER_STOP", {});
      }
      return;
    }

    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // INTERRUPT LOGIC: If we start recording while Mama is speaking, signal interrupt
        send("INTERRUPT", {});

        // Stop any current playback
        if (audioContextRef.current && audioContextRef.current.state === "running") {
          // Re-creating or resetting nextStartTime to "now" stops the scheduling buffer
          nextStartTimeRef.current = audioContextRef.current.currentTime;
        }

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              send("USER_AUDIO", { audio: base64 });
            };
            reader.readAsDataURL(event.data);
          }
        };

        // Send small chunks for real-time responsiveness
        recorder.start(100);

      } catch (err) {
        console.error("Failed to start audio", err);
        setError("Microphone access denied");
      }
    };

    startRecording();

    return () => {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [enabled, send]);

  if (error) {
    return <div className="p-4 text-red-500 bg-red-100 rounded-lg">{error}</div>;
  }

  return null;
}

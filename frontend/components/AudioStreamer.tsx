
import { useEffect, useRef, useState } from "react";
import { useRealtime } from "../context/RealtimeContext";



export function AudioStreamer({ enabled }: { enabled: boolean }) {
  const { send, lastMessage } = useRealtime();
  const [error, setError] = useState<string>();

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const playAudioChunk = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = audioContextRef.current.currentTime;
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      // Gemini returns PCM16 Little Endian. Convert to Float32 for Web Audio
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, ctx.sampleRate);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  useEffect(() => {
    if (lastMessage?.type === "MAMA_AUDIO" && lastMessage.payload?.audio) {
      playAudioChunk(lastMessage.payload.audio as string);
    }
  }, [lastMessage]);

  useEffect(() => {
    const cleanupRecording = () => {
      if (workletNodeRef.current) {
        workletNodeRef.current.port.onmessage = null;
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (!enabled) {
        send("USER_STOP", {});
      }
    };

    if (!enabled) {
      cleanupRecording();
      return;
    }

    const startRecording = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }
        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") await ctx.resume();

        try {
          await ctx.audioWorklet.addModule("/audio-processor.js");
        } catch (e) {
          console.warn("Worklet module error:", e);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        send("INTERRUPT", {});
        if (ctx.state === "running") {
          nextStartTimeRef.current = ctx.currentTime;
        }

        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        const workletNode = new AudioWorkletNode(ctx, "audio-processor");
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (event) => {
          const buffer = event.data;
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          send("USER_AUDIO", { audio: base64 });
        };

        source.connect(workletNode);
      } catch (err) {
        console.error("Failed to start audio", err);
        setError("Microphone access denied");
      }
    };

    startRecording();
    return cleanupRecording;
  }, [enabled, send]);

  if (error) {
    return (
      <div className="fixed bottom-24 right-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md z-50">
        MIC_ERROR: {error}
      </div>
    );
  }

  return null;
}

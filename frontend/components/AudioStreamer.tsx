
import { useEffect, useRef, useState } from "react";
import { useRealtime } from "../context/RealtimeContext";

export function AudioStreamer({ enabled }: { enabled: boolean }) {
  const { send, lastMessage, connected } = useRealtime();
  const [error, setError] = useState<string>();

  const playbackContextRef = useRef<AudioContext | null>(null);
  const recordingContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const playAudioChunk = async (base64Audio: string) => {
    try {
      if (!playbackContextRef.current) {
        // Gemini returns 24kHz Mono PCM16
        playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = playbackContextRef.current.currentTime;
      }
      const ctx = playbackContextRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

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
    let cancelled = false;

    const cleanupRecording = async () => {
      cancelled = true;
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
      // Instead of closing, we suspend to avoid rebuild overhead during quick toggles
      if (recordingContextRef.current && recordingContextRef.current.state !== "closed") {
        try {
          await recordingContextRef.current.suspend();
        } catch (e) {
          console.warn("Suspend error:", e);
        }
      }

      if (!enabled && connected) {
        send("USER_STOP", {});
      }
    };

    if (!enabled || !connected) {
      if (!enabled) void cleanupRecording();
      return;
    }

    const startRecording = async () => {
      try {
        if (!recordingContextRef.current || recordingContextRef.current.state === "closed") {
          recordingContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }
        const ctx = recordingContextRef.current;

        if (ctx.state === "suspended") await ctx.resume();
        if (cancelled) return;

        try {
          await ctx.audioWorklet.addModule("/audio-processor.js");
        } catch (e) {
          // Already added or error handling
        }
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        if (connected) {
          send("INTERRUPT", {});
        }

        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        // FINAL GUARD: Ensure context is still alive
        if (ctx.state === "closed" || cancelled) {
          source.disconnect();
          return;
        }

        const workletNode = new AudioWorkletNode(ctx, "audio-processor");
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (event) => {
          if (cancelled || !connected) return;
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
        setError(undefined);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to start audio", err);
        setError(err instanceof Error ? err.message : "Microphone access denied");
      }
    };

    void startRecording();
    return () => {
      void cleanupRecording();
    };
  }, [enabled, connected, send]);

  if (error) {
    return (
      <div className="fixed bottom-24 right-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md z-50">
        MIC_ERROR: {error}
      </div>
    );
  }

  return null;
}

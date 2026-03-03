import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MicrophoneState {
  stream: MediaStream | null;
  level: number;
  listening: boolean;
  error?: string;
  start: () => Promise<void>;
  stop: () => void;
}

export function useMicrophone(): MicrophoneState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [level, setLevel] = useState(0);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>();
  const rafRef = useRef<number | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyzerRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setListening(false);
    setLevel(0);
  }, [stream]);

  const start = useCallback(async () => {
    setError(undefined);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(media);
      setListening(true);

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(media);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 128;
      source.connect(analyzer);
      audioCtxRef.current = audioContext;
      analyzerRef.current = analyzer;

      const data = new Uint8Array(analyzer.frequencyBinCount);
      const tick = () => {
        const currentAnalyzer = analyzerRef.current;
        if (!currentAnalyzer) {
          return;
        }
        currentAnalyzer.getByteFrequencyData(data);
        const avg = data.reduce((sum, item) => sum + item, 0) / data.length;
        setLevel(Math.min(1, avg / 128));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access microphone");
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return useMemo(
    () => ({ stream, level, listening, error, start, stop }),
    [error, level, listening, start, stop, stream]
  );
}

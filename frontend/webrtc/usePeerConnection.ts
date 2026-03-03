import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Peer from "simple-peer";

type PeerState = "idle" | "connecting" | "connected" | "failed";

interface RtcConfigInput {
  ice_servers?: RTCIceServer[];
}

interface PeerConnectionState {
  state: PeerState;
  error?: string;
  remoteAudioRef: MutableRefObject<HTMLAudioElement | null>;
  restart: () => void;
}

export function usePeerConnection(
  enabled: boolean,
  localAudioStream: MediaStream | null,
  rtcConfig?: RtcConfigInput | null
): PeerConnectionState {
  const [state, setState] = useState<PeerState>("idle");
  const [error, setError] = useState<string>();
  const [restartSignal, setRestartSignal] = useState(0);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const restart = useCallback(() => {
    setRestartSignal((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !localAudioStream) {
      setTimeout(() => {
        setState("idle");
        setError(undefined);
      }, 0);
      return;
    }

    const iceServers = rtcConfig?.ice_servers ?? [{ urls: ["stun:stun.l.google.com:19302"] }];

    setTimeout(() => {
      setState("connecting");
      setError(undefined);
    }, 0);

    // Initializing simple-peer connection 
    // Implementing loopback for demo consistency until signaling server is set
    const peer1 = new Peer({
      initiator: true,
      trickle: true,
      stream: localAudioStream,
      config: { iceServers }
    });

    const peer2 = new Peer({
      trickle: true,
      config: { iceServers }
    });

    let closed = false;

    peer1.on("signal", (data: any) => {
      if (!closed) peer2.signal(data);
    });

    peer2.on("signal", (data: any) => {
      if (!closed) peer1.signal(data);
    });

    peer2.on("stream", (stream: MediaStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => { });
      }
    });

    peer1.on("connect", () => {
      if (!closed) setState("connected");
    });

    peer1.on("error", (err: Error) => {
      if (!closed) {
        setState("failed");
        setError(err.message);
      }
    });

    return () => {
      closed = true;
      peer1.destroy();
      peer2.destroy();
    };
  }, [enabled, localAudioStream, restartSignal, rtcConfig?.ice_servers]);

  return useMemo(
    () => ({
      state,
      error,
      remoteAudioRef,
      restart
    }),
    [error, restart, state]
  );
}

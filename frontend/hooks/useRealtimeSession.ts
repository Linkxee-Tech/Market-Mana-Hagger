import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UnifiedWsIncoming } from "../types/api";
import { firebaseAuth } from "../services/firebase";

function resolveWsBaseUrl(): string {
  // 1. Explicit WS URL setup
  const explicit = process.env.NEXT_PUBLIC_WS_BASE_URL as string | undefined;
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }

  // 2. Derive from API Base (must point to backend, NOT window.location.origin)
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined);
  if (apiBase && apiBase.trim()) {
    try {
      const parsed = new URL(apiBase.trim());
      parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      return parsed.origin;
    } catch {
      // Fallback if URL parsing fails
    }
  }

  // 3. Fallback to localhost if no env vars exist (local dev)
  return "ws://127.0.0.1:8080";
}

export function useRealtimeSession(sessionId?: string, persona: string = "ibadan") {
  const [lastMessage, setLastMessage] = useState<UnifiedWsIncoming | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const manualCloseRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const wsBase = resolveWsBaseUrl();
    manualCloseRef.current = false;
    let cancelled = false;

    const connect = async () => {
      if (cancelled) {
        return;
      }

      let token = "";
      try {
        if (firebaseAuth?.currentUser) {
          token = await firebaseAuth.currentUser.getIdToken();
        }
      } catch (e) {
        console.warn("[useRealtimeSession] Failed to get auth token", e);
      }

      const fullUrl = `${wsBase}/ws/${sessionId}?persona=${persona}${token ? `&token=${token}` : ""}`;
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        ws.send(JSON.stringify({ type: "PING", payload: { sessionId } }));

        if (heartbeatRef.current !== null) {
          window.clearInterval(heartbeatRef.current);
        }
        heartbeatRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING", payload: { sessionId } }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as UnifiedWsIncoming;
          setLastMessage(payload);
        } catch {
          // Ignore malformed payloads.
        }
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = (e) => {
        if (e.code !== 1000) {
          console.log("[useRealtimeSession] Closed:", e.code, e.reason);
        }
        setConnected(false);
        if (heartbeatRef.current !== null) {
          window.clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        if (manualCloseRef.current || cancelled) {
          return;
        }

        reconnectAttemptRef.current += 1;
        const attempt = reconnectAttemptRef.current;
        setReconnectAttempt(attempt);
        const backoff = Math.min(10000, 1000 * Math.max(1, attempt));
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, backoff);
      };
    };

    connect();

    return () => {
      cancelled = true;
      manualCloseRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (heartbeatRef.current !== null) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [sessionId, persona]);

  const send = useCallback((type: string, payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      if (!manualCloseRef.current) {
        console.warn("[useRealtimeSession] Cannot send, socket not open", type);
      }
      return false;
    }
    ws.send(JSON.stringify({ type, payload }));
    return true;
  }, []);

  return useMemo(
    () => ({ connected, lastMessage, reconnectAttempt, send }),
    [connected, lastMessage, reconnectAttempt, send]
  );
}

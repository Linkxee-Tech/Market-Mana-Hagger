import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { UnifiedWsIncoming } from "../types/api";

interface RealtimeContextValue {
    connected: boolean;
    lastMessage: UnifiedWsIncoming | null;
    reconnectAttempt: number;
    send: (type: string, payload: Record<string, unknown>) => boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

function resolveWsBaseUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_WS_BASE_URL as string | undefined;
    if (explicit && explicit.trim()) return explicit.trim();

    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined);
    if (apiBase && apiBase.trim()) {
        try {
            const parsed = new URL(apiBase.trim());
            parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
            return parsed.origin;
        } catch { }
    }
    return "ws://127.0.0.1:8080";
}

export function RealtimeProvider({ children, sessionId, persona = "ibadan" }: { children: React.ReactNode; sessionId?: string; persona?: string }) {
    const [lastMessage, setLastMessage] = useState<UnifiedWsIncoming | null>(null);
    const [connected, setConnected] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const heartbeatRef = useRef<number | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const reconnectAttemptRef = useRef(0);
    const manualCloseRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            setConnected(false);
            return;
        }

        const wsBase = resolveWsBaseUrl();
        manualCloseRef.current = false;
        let cancelled = false;

        const connect = () => {
            if (cancelled) return;

            console.log(`[Realtime] Connecting to ${wsBase}/ws/${sessionId}?persona=${persona}`);
            const ws = new WebSocket(`${wsBase}/ws/${sessionId}?persona=${persona}`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[Realtime] Connected");
                setConnected(true);
                reconnectAttemptRef.current = 0;
                setReconnectAttempt(0);
                ws.send(JSON.stringify({ type: "PING", payload: { sessionId } }));

                if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
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
                } catch (e) {
                    console.error("[Realtime] Failed to parse message", e);
                }
            };

            ws.onerror = (e) => {
                console.error("[Realtime] Error", e);
                setConnected(false);
            };

            ws.onclose = (e) => {
                console.log("[Realtime] Closed", e.code, e.reason);
                setConnected(false);
                if (heartbeatRef.current) {
                    window.clearInterval(heartbeatRef.current);
                    heartbeatRef.current = null;
                }

                if (manualCloseRef.current || cancelled) return;

                reconnectAttemptRef.current += 1;
                setReconnectAttempt(reconnectAttemptRef.current);
                const backoff = Math.min(6000, 400 * Math.max(1, reconnectAttemptRef.current));

                if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = window.setTimeout(connect, backoff);
            };
        };

        connect();

        return () => {
            cancelled = true;
            manualCloseRef.current = true;
            if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
            if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [sessionId, persona]);

    const send = useCallback((type: string, payload: Record<string, unknown>) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn("[Realtime] Cannot send, socket not open", type);
            return false;
        }
        ws.send(JSON.stringify({ type, payload }));
        return true;
    }, []);

    const value = useMemo(() => ({
        connected,
        lastMessage,
        reconnectAttempt,
        send
    }), [connected, lastMessage, reconnectAttempt, send]);

    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
    const context = useContext(RealtimeContext);
    if (context === undefined) {
        throw new Error("useRealtime must be used within a RealtimeProvider");
    }
    return context;
}

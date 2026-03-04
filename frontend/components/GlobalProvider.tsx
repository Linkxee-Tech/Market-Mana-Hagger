"use client";

import { ReactNode } from "react";
import { RealtimeProvider } from "../context/RealtimeContext";
import { AudioStreamer } from "./AudioStreamer";
import { useSessionStore } from "../store/useSessionStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUserStore } from "../store/useUserStore";

export function GlobalProvider({ children }: { children: ReactNode }) {
    const { sessionId } = useSessionStore();
    const { selectedPersona } = useSettingsStore();
    const { micActive } = useUserStore();

    return (
        <RealtimeProvider sessionId={sessionId || undefined} persona={selectedPersona}>
            {children}
            {sessionId && <AudioStreamer enabled={micActive} />}
        </RealtimeProvider>
    );
}

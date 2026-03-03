"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import HagglePage from "../haggle/page";
import { useSession } from "../../hooks/useSession";
import { RealtimeProvider } from "../../context/RealtimeContext";
import { useSettingsStore } from "../../store/useSettingsStore";

function SessionContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("id");
    const { session, loadSessionById } = useSession();

    const { selectedPersona } = useSettingsStore();

    useEffect(() => {
        if (sessionId && (!session || session.id !== sessionId)) {
            loadSessionById(sessionId);
        }
    }, [sessionId, session, loadSessionById]);

    return (
        <RealtimeProvider sessionId={sessionId || undefined} persona={selectedPersona}>
            <HagglePage />
        </RealtimeProvider>
    );
}

export default function SessionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-ui-bg flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-emerald"></div>
        </div>}>
            <SessionContent />
        </Suspense>
    );
}

"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { TopNav } from "../../components/TopNav";
import { ControlBar } from "../../components/ControlBar";
import { SessionPanel } from "../../components/SessionPanel";
import { ScreenshotUpload } from "../../components/ScreenshotUpload";
import { MamaAvatar } from "../../components/MamaAvatar";
import { TranscriptBox, TranscriptEntry } from "../../components/TranscriptBox";
import { ActionFeed } from "../../components/ActionFeed";
import { AudioStreamer } from "../../components/AudioStreamer";
import { SavingsMeter } from "../../components/SavingsMeter";
import { ConfettiBurst } from "../../components/ConfettiBurst";
import { Footer } from "../../components/Footer";
import { LeaderboardPanel } from "../../components/LeaderboardPanel";
import { ClipGenerator } from "../../components/ClipGenerator";
import { AutoHaggleOverlay } from "../../components/AutoHaggleOverlay";
import { OnboardingTour } from "../../components/OnboardingTour";

import { useRouter } from "next/navigation";
import { useSession } from "../../hooks/useSession";
import { useRealtime } from "../../context/RealtimeContext";
import { RealtimeProvider } from "../../context/RealtimeContext";
import { useScreenCapture } from "../../hooks/useScreenCapture";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { UiAction } from "../../types/api";
import { executeAction } from "../../services/api";
import { firebaseAuth } from "../../services/firebase";

import { useSettingsStore } from "../../store/useSettingsStore";
import { useUserStore } from "../../store/useUserStore";
import { useSessionStore } from "../../store/useSessionStore";
import { useMamaStore } from "../../store/useMamaStore";

interface SavingsPayload { totalSavings: number; suggestion?: string; }
interface SpeechPayload { speech: string; }
interface ActionsPayload { actions: UiAction[]; }
interface ClipPayload { status: string; progress?: number; url?: string; }

export default function HagglePage() {
    const { session, loading: sessionLoading, beginSession, stopSession, refreshSession } = useSession();

    return (
        <HagglePageContent
            session={session}
            sessionLoading={sessionLoading}
            beginSession={beginSession}
            stopSession={stopSession}
            refreshSession={refreshSession}
        />
    );
}

function HagglePageContent({ session, sessionLoading, beginSession, stopSession, refreshSession }: any) {
    const { userId, isAnonymous, _hasHydrated } = useUserStore();
    const router = useRouter();

    const { selectedPersona, setSelectedPersona, autoAnalyze, setAutoAnalyze, autoHaggle, setAutoHaggle, hasSeenTour, setHasSeenTour } = useSettingsStore();
    const { micActive, setMicActive } = useUserStore();
    const { actions, setActions, savings, setSavings } = useSessionStore();
    const {
        lastLine: currentSpeech, setLastLine: setCurrentSpeech,
        mood: mamaEmotion, setMood: setMamaEmotion,
        animationTrigger: mamaState, setAnimationTrigger: setMamaState,
        transcriptEntries, addTranscriptEntry, setTranscriptEntries
    } = useMamaStore();

    const { connected: realtimeConnected, lastMessage, send } = useRealtime();
    const { stream: screenStream, previewRef, startShare, stopShare, takeSnapshot, uploadFile, error: screenError, screenshotDataUrl } = useScreenCapture();
    const { entries: leaderboardEntries, loading: leaderboardLoading } = useLeaderboard();

    const [analyzing, setAnalyzing] = useState(false);
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

    // Clip State
    const [clipLoading, setClipLoading] = useState(false);
    const [clipUrl, setClipUrl] = useState<string>();
    const [clipStatus, setClipStatus] = useState<string>("idle");
    const [clipProgress, setClipProgress] = useState(0);

    // State from Realtime
    const [confetti, setConfetti] = useState(false);
    const savingsRef = useRef(0);

    // Handler for Realtime Messages
    useEffect(() => {
        if (!lastMessage) return;

        setTimeout(() => {
            if (lastMessage.type === "SAVINGS_UPDATE") {
                const payload = lastMessage.payload as any;
                const newVal = payload.totalSavings || 0;
                setSavings(newVal);

                if (payload.mood) {
                    setMamaEmotion(payload.mood);
                }

                // Check if savings increased to trigger confetti
                if (newVal > savingsRef.current) {
                    setConfetti(true);
                    setTimeout(() => setConfetti(false), 3000);
                }
                savingsRef.current = newVal;
            } else if (lastMessage.type === "MAMA_SPEAK" || lastMessage.type === "MAMA_AUDIO") {
                setMamaState("SPEAKING");
                // For MAMA_AUDIO, we might not have the text immediately if we don't transcribe, 
                // but for this demo, let's assume the backend also sends a text event or we keep the simulated one.
                if (lastMessage.payload?.speech) {
                    setCurrentSpeech(lastMessage.payload.speech as string);
                    addTranscriptEntry({
                        id: Date.now().toString(),
                        speaker: "mama",
                        text: (lastMessage.payload.speech as string) || "",
                        timestamp: new Date().toLocaleTimeString()
                    });
                }

                if (lastMessage.payload?.emotion) {
                    setMamaEmotion(lastMessage.payload.emotion as any);
                }

                setTimeout(() => setMamaState("IDLE"), 5000);
            } else if (lastMessage.type === "CONNECTED") {
                const payload = lastMessage.payload as any;
                setSavings(payload.totalSavings || 0);
            } else if (lastMessage.type === "HIGHLIGHT") {
                const payload = lastMessage.payload as unknown as ActionsPayload;
                if (payload.actions) {
                    setActions(payload.actions);
                }
            } else if (lastMessage.type === "CLIP_UPDATE") {
                const payload = lastMessage.payload as unknown as ClipPayload;
                setClipStatus(payload.status);
                if (payload.progress) setClipProgress(payload.progress);
                if (payload.url) {
                    setClipUrl(payload.url);
                    setClipLoading(false);
                }
                if (payload.status === "failed") {
                    setClipLoading(false);
                }
            }
        }, 0);
    }, [lastMessage]);

    // Auto Haggle Loop (Simulated Automation)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (autoHaggle && actions.length > 0 && session?.id) {
            // If we have actions, let's "execute" them one by one
            let index = 0;
            timer = setInterval(async () => {
                const action = actions[index];
                if (action) {
                    // Provide feedback
                    setCurrentSpeech(`Wait o, I'm checking ${action.target}...`);
                    try {
                        // Actually execute on backend replacing missing action.id with composite string
                        const token = firebaseAuth?.currentUser ? await firebaseAuth.currentUser.getIdToken() : undefined;
                        const actionId = `${action.action_type}_${action.target}`;
                        await executeAction(session.id, actionId, token);
                    } catch (err) {
                        console.error("AutoHaggle Execution Error:", err);
                    }
                    index = (index + 1) % actions.length;
                }
            }, 4000);
        }
        return () => clearInterval(timer);
    }, [autoHaggle, actions, session?.id, setCurrentSpeech]);

    // Auto Analyze Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoAnalyze && session?.id && screenStream && !analyzing) {
            interval = setInterval(async () => {
                if (analyzing) return;
                setAnalyzing(true);
                const shot = await takeSnapshot(true);
                if (shot) {
                    send("VISION_SCAN", { screenshot: shot });
                }
                setAnalyzing(false);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [autoAnalyze, session?.id, screenStream, analyzing, takeSnapshot, send]);

    const handleStartSession = useCallback(async () => {
        try {
            const result = await beginSession();
            if (result?.session?.id) {
                setCurrentSpeech("Mama is connected! Share your screen and let's start haggling.");
                setMamaState("IDLE");
            }
        } catch (err) {
            console.error("Failed to start session:", err);
            setCurrentSpeech("Chai! Something went wrong connecting. Try again, my pikin.");
        }
    }, [beginSession, setCurrentSpeech, setMamaState]);

    const handleEndSession = useCallback(async () => {
        await stopSession();
        stopShare();
        setMicActive(false);
        setAutoAnalyze(false);
    }, [stopSession, stopShare]);

    const handleSnapshot = useCallback(async () => {
        setAnalyzing(true);
        const shot = await takeSnapshot();
        if (shot && session?.id) {
            send("VISION_SCAN", { screenshot: shot });
        }
        setAnalyzing(false);
    }, [takeSnapshot, session?.id, send]);

    const handleSendLiveMessage = useCallback(async (text: string) => {
        if (!session?.id) return;

        addTranscriptEntry({
            id: Date.now().toString(),
            speaker: "user",
            text: text,
            timestamp: new Date().toLocaleTimeString()
        });

        setMamaState("THINKING");
        send("USER_SPEECH", { text });
    }, [session?.id, send, addTranscriptEntry, setMamaState]);

    const handleGenerateClip = useCallback(async () => {
        if (!session?.id) return;
        setClipLoading(true);
        setClipStatus("queued");
        setClipProgress(0);
        send("GENERATE_CLIP", {});
    }, [session?.id, send]);

    const onScreenshotLoad = useCallback((width: number, height: number) => {
        setScreenSize({ width, height });
    }, []);

    if (!_hasHydrated || (!userId || isAnonymous)) {
        return (
            <div className="min-h-screen bg-ui-bg flex flex-col gap-6 pb-12 pt-28 animate-pulse">
                <div className="px-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <section className="premium-card h-96 bg-white/5" />
                        <div className="premium-card h-20 bg-white/5" />
                        <div className="grid grid-cols-2 gap-6">
                            <div className="premium-card h-32 bg-white/5" />
                            <div className="premium-card h-32 bg-white/5" />
                        </div>
                    </div>
                    <aside className="lg:col-span-4 flex flex-col gap-6">
                        <div className="premium-card h-40 bg-white/5" />
                        <div className="premium-card h-64 bg-white/5" />
                        <div className="premium-card h-48 bg-white/5" />
                    </aside>
                </div>
            </div>
        );
    }

    const TOUR_STEPS = [
        {
            targetId: "tour-start-session",
            title: "Welcome to the Market!",
            description: "Click here to connect to Mama. She's ready to help you negotiate better prices.",
            position: "bottom" as const
        },
        {
            targetId: "tour-share-btn",
            title: "Share the Item",
            description: "Once connected, share your screen so Mama can see the product and price tag.",
            position: "bottom" as const
        },
        {
            targetId: "tour-mic-btn",
            title: "Talk to Mama",
            description: "Turn on your mic and tell Mama what you want to pay. She will give you the right words to use!",
            position: "bottom" as const
        },
        {
            targetId: "tour-snapshot-btn",
            title: "Analyze the Price",
            description: "Click here for Mama to instantly scan the screen, find coupons, and calculate your potential savings.",
            position: "bottom" as const
        }
    ];

    return (
        <main className="min-h-screen flex flex-col gap-6 pb-12 pt-28">
            <TopNav
                theme="dark"
                showThemeToggle
            />

            <div className="flex-1 px-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Capture & Analysis */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <section className="premium-card relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 z-20">
                            {analyzing && (
                                <div className="flex items-center gap-2 text-brand-emerald text-xs font-mono">
                                    <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-ping" />
                                    ANALYZING_VIEWPORT
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-6 bg-brand-emerald rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <h2 className="text-xl font-black uppercase tracking-tighter">Live Capture</h2>
                        </div>

                        <ScreenshotUpload
                            previewRef={previewRef}
                            active={!!screenStream}
                            error={screenError}
                            onFileUpload={uploadFile}
                            screenshotDataUrl={screenshotDataUrl}
                            actions={actions}
                            screenSize={screenSize}
                            onScreenshotLoad={onScreenshotLoad}
                        />
                        <AutoHaggleOverlay
                            active={autoHaggle}
                            target={actions.length > 0 ? actions[0].target : undefined}
                            coords={actions.length > 0 ? actions[0].highlight_coords : undefined}
                        />
                    </section>

                    <ControlBar
                        sessionReady={!!session?.id && realtimeConnected}
                        sessionConnecting={!!session?.id && !realtimeConnected}
                        sessionLoading={sessionLoading}
                        micListening={micActive}
                        liveLoading={mamaState === "THINKING"}
                        shareActive={!!screenStream}
                        autoAnalyze={autoAnalyze}
                        analyzing={analyzing}
                        webrtcState={realtimeConnected ? "connected" : "idle"}
                        onQuickStart={handleStartSession}
                        onStartSession={handleStartSession}
                        onEndSession={handleEndSession}
                        onRestartSession={async () => { await refreshSession(); }}
                        onToggleMic={async () => setMicActive(!micActive)}
                        onStartShare={startShare}
                        onStopShare={stopShare}
                        onSnapshot={handleSnapshot}
                        onToggleAutoAnalyze={() => setAutoAnalyze(!autoAnalyze)}
                        autoHaggle={autoHaggle}
                        onToggleAutoHaggle={() => setAutoHaggle(!autoHaggle)}
                    />

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="premium-card">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Savings Insights</h3>
                            <SavingsMeter amount={savings} currency="NGN" animated={confetti} />
                        </div>
                        <div className="premium-card">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Collective Leaderboard</h3>
                            <LeaderboardPanel entries={leaderboardEntries} loading={leaderboardLoading} />
                        </div>
                    </section>
                </div>

                {/* Right Column: AI Agent & Transcript */}
                <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
                    <section className="premium-card">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Select Mama's Persona</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: "ibadan", name: "Ibadan", icon: "🌶️" },
                                { id: "kano", name: "Kano", icon: "🕌" },
                                { id: "lagos", name: "Lagos", icon: "💅" }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersona(p.id)}
                                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${selectedPersona === p.id
                                        ? "border-brand-emerald bg-brand-emerald/10 scale-105"
                                        : "border-white/5 bg-white/5 grayscale hover:grayscale-0"
                                        }`}
                                >
                                    <span className="text-xl">{p.icon}</span>
                                    <span className="text-[10px] mt-1 font-bold">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <MamaAvatar
                        connected={realtimeConnected}
                        transcript={transcriptEntries.length > 0 ? transcriptEntries[transcriptEntries.length - 1].text : undefined}
                        speech={currentSpeech}
                        confidence={lastMessage?.type === "MAMA_SPEAK" ? (lastMessage.payload as any).confidence : undefined}
                        emotion={mamaEmotion}
                    />

                    <section className="premium-card flex-1 max-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Realtime Channel</h3>
                            {realtimeConnected && <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            <TranscriptBox entries={transcriptEntries} />
                        </div>

                        <div className="mt-6">
                            <form
                                className="relative"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.currentTarget);
                                    const text = fd.get("message") as string;
                                    if (text.trim()) {
                                        handleSendLiveMessage(text);
                                        e.currentTarget.reset();
                                    }
                                }}
                            >
                                <input
                                    name="message"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-emerald/50 transition-colors"
                                    placeholder="Type a message to Mama..."
                                    disabled={!session?.id}
                                />
                                <button
                                    type="submit"
                                    disabled={!session?.id}
                                    className="absolute right-2 top-1.5 p-1.5 rounded-lg bg-brand-emerald/20 text-brand-emerald hover:bg-brand-emerald/30 transition-colors disabled:opacity-0"
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </section>

                    {clipUrl && (
                        <section className="premium-card animate-[slide-up_0.5s_ease-out]">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Session Highlight</h3>
                            <ClipGenerator
                                loading={clipLoading}
                                clipUrl={clipUrl}
                                status={clipStatus}
                                progress={clipProgress}
                                onGenerate={handleGenerateClip}
                                onCopy={async () => { if (clipUrl) navigator.clipboard.writeText(clipUrl); }}
                                onOpenShare={(kind) => {
                                    const text = `Mama helped me save ${savings} NGN! 🛒 Check out my haggling highlight: ${clipUrl}`;
                                    const encodedText = encodeURIComponent(text);
                                    const encodedUrl = encodeURIComponent(clipUrl || "");

                                    if (kind === "twitter") {
                                        window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank");
                                    } else if (kind === "whatsapp") {
                                        window.open(`https://wa.me/?text=${encodedText}`, "_blank");
                                    } else {
                                        alert("QR Feature: Scan to Share!");
                                    }
                                }}
                            />
                        </section>
                    )}

                    <ActionFeed actions={actions} />
                </aside>
            </div>

            <Footer />
            <ConfettiBurst active={confetti} />
            <OnboardingTour
                steps={TOUR_STEPS}
                isOpen={!hasSeenTour && !!userId}
                onComplete={() => setHasSeenTour(true)}
            />
        </main>
    );
}

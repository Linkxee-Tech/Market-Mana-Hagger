interface ControlBarProps {
  sessionReady: boolean;
  sessionConnecting: boolean;
  sessionLoading: boolean;
  micListening: boolean;
  liveLoading: boolean;
  shareActive: boolean;
  autoAnalyze: boolean;
  analyzing: boolean;
  webrtcState: "idle" | "connecting" | "connected" | "failed";
  onQuickStart: () => Promise<void>;
  onStartSession: () => Promise<void>;
  onEndSession: () => Promise<void>;
  onRestartSession: () => Promise<void>;
  onToggleMic: () => Promise<void>;
  onStartShare: () => Promise<void>;
  onStopShare: () => void;
  onSnapshot: () => Promise<void>;
  onToggleAutoAnalyze: () => void;
  autoHaggle: boolean;
  onToggleAutoHaggle: () => void;
}

export function ControlBar({
  sessionReady,
  sessionConnecting,
  sessionLoading,
  micListening,
  liveLoading,
  shareActive,
  autoAnalyze,
  analyzing,
  webrtcState,
  onQuickStart,
  onStartSession,
  onEndSession,
  onRestartSession,
  onToggleMic,
  onStartShare,
  onStopShare,
  onSnapshot,
  onToggleAutoAnalyze,
  autoHaggle,
  onToggleAutoHaggle
}: ControlBarProps) {
  return (
    <div className="premium-card !p-4 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
      <button
        id="tour-start-session"
        className={`px-6 py-2 rounded-xl font-bold transition-all sm:flex-none ${sessionReady
          ? "bg-brand-emerald text-white glow-emerald"
          : "bg-white/5 hover:bg-white/10 text-brand-emerald border border-brand-emerald/30"
          }`}
        onClick={() => void onQuickStart()}
        disabled={sessionLoading || sessionConnecting || sessionReady}
      >
        {sessionLoading ? "Initializing..." : sessionConnecting ? "Connecting..." : sessionReady ? "Haggling Active" : "Start Haggling"}
      </button>

      <div className="w-full h-px sm:w-px sm:h-8 bg-white/10 sm:mx-2 hidden sm:block" />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          id="tour-mic-btn"
          className={`p-2 rounded-xl border transition-all ${micListening ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400" : "bg-white/5 border-white/10 text-white/40"
            }`}
          onClick={() => void onToggleMic()}
          disabled={!sessionReady || liveLoading}
          title={micListening ? "Stop Mic" : "Start Mic"}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" />
          </svg>
        </button>

        <button
          id="tour-share-btn"
          className={`p-2 rounded-xl border transition-all ${shareActive ? "bg-brand-emerald/20 border-brand-emerald/50 text-brand-emerald" : "bg-white/5 border-white/10 text-white/40"
            }`}
          onClick={() => void (shareActive ? onStopShare() : onStartShare())}
          disabled={!sessionReady}
          title={shareActive ? "Stop Share" : "Share Screen"}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <path d="M8 21h8m-4-4v4" />
          </svg>
        </button>

        <button
          id="tour-snapshot-btn"
          className={`p-2 rounded-xl border transition-all ${analyzing ? "bg-brand-gold/20 border-brand-gold/50 text-brand-gold animate-pulse" : "bg-white/5 border-white/10 text-white/40"
            }`}
          onClick={() => void onSnapshot()}
          disabled={!sessionReady || analyzing}
          title="Analyze Snapshot"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${autoAnalyze ? "bg-brand-emerald border-brand-emerald text-black" : "bg-white/5 border-white/10 text-white/40"
            }`}
          onClick={onToggleAutoAnalyze}
          disabled={!sessionReady || !shareActive}
        >
          Auto: {autoAnalyze ? "On" : "Off"}
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${autoHaggle ? "bg-fuchsia-600 border-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]" : "bg-white/5 border-white/10 text-white/40"
            }`}
          onClick={onToggleAutoHaggle}
          disabled={!sessionReady}
          title="Auto-Haggle: Mama takes the wheel!"
        >
          Haggle: {autoHaggle ? "Auto" : "Manual"}
        </button>
      </div>

      <div className="flex-1 hidden sm:block" />

      <button
        className="text-xs text-white/20 hover:text-red-400 transition-colors"
        onClick={() => void onEndSession()}
        disabled={!sessionReady}
      >
        Terminate Session
      </button>
    </div>
  );
}

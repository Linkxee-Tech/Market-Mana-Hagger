interface SessionPanelProps {
  sessionId?: string;
  status: string;
  realtimeConnected: boolean;
  error?: string;
}

export function SessionPanel({ sessionId, status, realtimeConnected, error }: SessionPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Active Session</span>
          <span className="text-sm font-mono text-fuchsia-100/80">{sessionId?.slice(0, 12) ?? "NONE-INIT"}...</span>
        </div>
        <div className={`px-3 py-1 rounded-lg border text-[10px] font-black tracking-widest ${realtimeConnected ? "bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-white/5 border-white/10 text-white/20"
          }`}>
          {realtimeConnected ? "REALTIME_LINK" : "WAITING_INIT"}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-wider text-center">
          ERROR: {error}
        </div>
      )}
    </div>
  );
}

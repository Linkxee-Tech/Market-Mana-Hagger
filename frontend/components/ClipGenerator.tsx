import { useState } from "react";

interface ClipSharePanelProps {
  loading: boolean;
  clipUrl?: string;
  status?: string;
  progress?: number;
  error?: string;
  onGenerate: () => Promise<void>;
  onCopy: () => Promise<void>;
  onOpenShare: (kind: "twitter" | "whatsapp" | "qr") => void;
  disabled?: boolean;
}

export function ClipGenerator({
  loading,
  clipUrl,
  status,
  progress,
  error,
  onGenerate,
  onCopy,
  onOpenShare,
  disabled
}: ClipSharePanelProps) {
  const [showQR, setShowQR] = useState(false);
  const progressValue = Math.max(0, Math.min(100, progress ?? 0));

  const handleShare = (kind: "twitter" | "whatsapp" | "qr") => {
    if (kind === "qr") {
      setShowQR(true);
    } else {
      onOpenShare(kind);
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Render Status</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${status === "queued" || status === "processing" ? "text-brand-gold bg-brand-gold/10" : "text-brand-emerald bg-brand-emerald/10"
          }`}>
          {status ?? "IDLE"}
        </span>
      </div>

      <button
        className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-emerald-dark text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
        onClick={() => void onGenerate()}
        disabled={disabled || loading || status === "ready"}
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Synthesizing Clip...
          </>
        ) : status === "ready" ? (
          <>
            <span className="text-lg">✓</span>
            Clip Ready
          </>
        ) : "Generate Share Clip"}
      </button>

      {(loading || (progressValue > 0 && status !== "ready")) && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
            <span>Neural Rendering</span>
            <span>{progressValue}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full bg-brand-emerald transition-all duration-500 ${loading ? 'animate-pulse' : ''}`} style={{ width: `${progressValue}%` }} />
          </div>
        </div>
      )}

      {clipUrl && status === "ready" && (
        <div className="space-y-3 pt-2 animate-in fade-in zoom-in-95 duration-500">
          <div className="p-3 bg-black/40 rounded-xl border border-brand-emerald/20 flex items-center justify-between group glow-emerald/10">
            <span className="text-[10px] font-mono text-white/40 truncate mr-4 italic">
              {clipUrl}
            </span>
            <button
              onClick={() => void onCopy()}
              className="text-[10px] font-black text-brand-emerald uppercase tracking-widest hover:text-white transition-colors"
            >
              Copy
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleShare("twitter")} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold transition-all flex flex-col items-center gap-1 group">
              <span className="text-white/40 group-hover:text-white transition-colors">X</span>
              <span className="text-[8px] text-white/20 uppercase tracking-tighter">Twitter</span>
            </button>
            <button onClick={() => handleShare("whatsapp")} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold transition-all flex flex-col items-center gap-1 group">
              <span className="text-white/40 group-hover:text-white transition-colors">WA</span>
              <span className="text-[8px] text-white/20 uppercase tracking-tighter">WhatsApp</span>
            </button>
            <button onClick={() => handleShare("qr")} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold transition-all flex flex-col items-center gap-1 group">
              <span className="text-white/40 group-hover:text-white transition-colors">QR</span>
              <span className="text-[8px] text-white/20 uppercase tracking-tighter">Show</span>
            </button>
          </div>
        </div>
      )}

      {showQR && (
        <div className="absolute inset-0 bg-ui-bg/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 z-20 animate-in zoom-in-95 duration-300">
          <div className="w-32 h-32 bg-white p-2 rounded-lg mb-4 flex items-center justify-center">
            {/* Mock QR Code */}
            <div className="w-full h-full border-4 border-black grid grid-cols-4 grid-rows-4 gap-1 p-1">
              {[...Array(16)].map((_, i) => (
                <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
          <p className="text-[10px] font-black uppercase text-white/60 mb-4 tracking-widest">Scan to share savings</p>
          <button
            onClick={() => setShowQR(false)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Close
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-wider text-center animate-in shake duration-500">
          KERNEL_ERROR: {error}
        </div>
      )}
    </div>
  );
}

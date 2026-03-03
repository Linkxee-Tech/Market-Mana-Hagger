export interface TranscriptEntry {
  id: string;
  speaker: "user" | "mama";
  text: string;
  timestamp: string;
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
}

export function TranscriptBox({ entries }: LiveTranscriptProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
        <div className="w-12 h-12 rounded-full border border-dashed border-white/20 mb-4 flex items-center justify-center">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest font-bold">Silence is golden</p>
        <p className="text-[10px] mt-1">Start a session to see transcript</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className={`flex flex-col ${entry.speaker === "mama" ? "items-start" : "items-end text-right"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest ${entry.speaker === "mama" ? "text-brand-emerald" : "text-brand-gold"}`}>
              {entry.speaker === "mama" ? "MAMA_ENGINE" : "LOCAL_NODE"}
            </span>
            <span className="text-[9px] text-white/20 font-mono">{entry.timestamp}</span>
          </div>
          <div className={`
            max-w-[90%] px-3 py-2 rounded-2xl text-xs leading-relaxed
            ${entry.speaker === "mama"
              ? "bg-white/5 border border-white/10 text-fuchsia-100 rounded-tl-none"
              : "bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald rounded-tr-none"}
          `}>
            {entry.text}
          </div>
        </div>
      ))}
    </div>
  );
}

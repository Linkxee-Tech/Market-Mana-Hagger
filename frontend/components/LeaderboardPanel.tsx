import { LeaderboardEntry } from "../types/api";

interface LeaderboardPanelProps {
  loading: boolean;
  entries: LeaderboardEntry[];
}

function maskUser(userId: string): string {
  if (userId.length <= 6) return userId;
  return `${userId.slice(0, 3)}***${userId.slice(-2)}`;
}

export function LeaderboardPanel({ loading, entries }: LeaderboardPanelProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            <th className="py-2 text-[10px] font-black text-white/20 uppercase tracking-widest">Operator</th>
            <th className="py-2 text-[10px] font-black text-white/20 uppercase tracking-widest">Session</th>
            <th className="py-2 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Magnitude</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={`skeleton-${i}`} className="animate-pulse">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="h-2 w-16 bg-white/10 rounded" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-2 w-12 bg-white/5 rounded" />
                </td>
                <td className="py-3 pl-4 text-right">
                  <div className="h-2 w-10 bg-brand-emerald/10 rounded ml-auto" />
                </td>
              </tr>
            ))
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-8 text-center text-[10px] font-mono text-white/20">
                NO_SAVINGS_LOGGED_IN_REGISTRY
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.session_id} className="group hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald/50 group-hover:bg-brand-emerald transition-colors" />
                    <span className="text-[11px] font-bold text-fuchsia-100/80">{maskUser(entry.user_id)}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-[10px] font-mono text-white/30">{entry.session_id.slice(0, 8)}</span>
                </td>
                <td className="py-3 pl-4 text-right">
                  <span className="text-xs font-black text-brand-emerald">
                    {entry.total_savings.toLocaleString()}
                  </span>
                  <span className="text-[8px] text-brand-emerald/50 ml-1">NGN</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import { UiAction } from "../types/api";

interface ActionFeedProps {
  actions: UiAction[];
}

export function ActionFeed({ actions }: ActionFeedProps) {
  if (actions.length === 0) return null;

  return (
    <div className="premium-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-4 bg-brand-gold rounded-full" />
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Suggested Actions</h3>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <div key={`${action.target}-${index}`} className="glass-panel !rounded-xl p-3 border-l-2 border-brand-gold/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-fuchsia-100/90">{action.target}</span>
              <span className="text-[10px] font-mono text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded uppercase font-black">
                {action.action_type}
              </span>
            </div>
            {action.message && <div className="text-[11px] text-fuchsia-100/60 leading-tight mb-2">{action.message}</div>}
            {action.code && (
              <div className="bg-black/40 rounded px-2 py-1 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-mono text-brand-emerald">CTRL+C</span>
                <code className="text-[10px] font-mono text-white/80 whitespace-nowrap">{action.code}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SavingsCounterProps {
  amount: number;
  currency: string;
  animated?: boolean;
}

export function SavingsMeter({ amount, currency, animated }: SavingsCounterProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-white tracking-tighter">
          {amount.toLocaleString()}
        </span>
        <span className="text-sm font-bold text-brand-emerald/80 tracking-widest">
          {currency.toUpperCase()}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full bg-brand-emerald transition-all duration-1000 ${animated ? "animate-pulse" : ""}`}
            style={{ width: `${Math.min(100, (amount / 1000) * 100)}%` }}
          />
        </div>
        {amount > 0 && <span className="text-[10px] text-brand-emerald font-bold tracking-widest">+SAVED</span>}
      </div>
    </div>
  );
}

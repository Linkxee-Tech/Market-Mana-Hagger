interface WaveformProps {
  level: number;
  connected?: boolean;
}

export function Waveform({ level, connected = true }: WaveformProps) {
  const bars = Array.from({ length: 32 }, (_, i) => {
    const variance = ((i % 7) + 1) / 7;
    const height = connected
      ? Math.max(8, Math.round(64 * level * variance))
      : 4;

    return (
      <div
        key={i}
        className={`w-1.5 rounded-full transition-all duration-150 ${connected ? 'bg-gradient-to-t from-brand-emerald to-brand-emerald-light' : 'bg-fuchsia-100/10'}`}
        style={{ height: `${height}px` }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-1 h-20 w-full overflow-hidden px-4">
      {bars}
    </div>
  );
}

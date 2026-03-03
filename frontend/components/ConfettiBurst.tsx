interface ConfettiBurstProps {
  active: boolean;
}

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  if (!active) {
    return null;
  }

  const particles = Array.from({ length: 18 }, (_, index) => {
    const left = 5 + (index * 5) % 90;
    const delay = (index % 6) * 0.06;
    const hue = index % 2 === 0 ? "var(--market-yellow)" : "var(--deep-green)";
    return <span key={index} className="confetti-piece" style={{ left: `${left}%`, animationDelay: `${delay}s`, background: hue }} />;
  });

  return <div className="confetti-wrap" aria-hidden>{particles}</div>;
}

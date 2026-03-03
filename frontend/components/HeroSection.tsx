interface HeroSectionProps {
  onStart: () => Promise<void>;
  disabled?: boolean;
}

export function HeroSection({ onStart, disabled }: HeroSectionProps) {
  return (
    <section className="card padded hero">
      <h1 className="hero-title">Price No Be Price</h1>
      <p className="hero-subtitle">
        Market-Mama sees your screen, spots hidden deals, and coaches you live in bold bargaining style.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn cta" aria-label="Start haggling session" onClick={() => void onStart()} disabled={disabled}>
          Start Haggling
        </button>
        <span className="badge">Realtime voice + vision + savings</span>
      </div>
    </section>
  );
}

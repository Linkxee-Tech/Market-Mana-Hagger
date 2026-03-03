export function Footer() {
  return (
    <footer className="mt-auto px-4 py-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xl font-black brand-gradient-text tracking-tighter">Market-Mama</span>
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mt-1">
            Precision Bargaining Engine v2.0
          </p>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[10px] text-white/20 hover:text-white/40 cursor-default transition-colors">Privacy Protcol</span>
          <span className="text-[10px] text-white/20 hover:text-white/40 cursor-default transition-colors">Neural Terms</span>
          <span className="text-[10px] text-white/20 hover:text-white/40 cursor-default transition-colors">© 2026 MAMA_NETWORK</span>
        </div>
      </div>
    </footer>
  );
}

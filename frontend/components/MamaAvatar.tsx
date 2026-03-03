import { WaveformVisualizer } from "./WaveformVisualizer";
import React from "react";

interface AvatarPanelProps {
  connected: boolean;
  transcript?: string;
  speech?: string;
  confidence?: number;
  emotion?: 'neutral' | 'hype' | 'urgent' | 'reassure' | 'celebrate' | 'offended' | 'thinking' | 'happy' | 'talking' | 'shocked';
}

export function MamaAvatar({ connected, transcript, speech, confidence, emotion = 'neutral' }: AvatarPanelProps): React.JSX.Element {
  const getEmotionStyles = () => {
    switch (emotion) {
      case 'hype':
        return {
          glow: "glow-gold",
          border: "border-brand-gold",
          bg: "from-brand-gold-dark to-black",
          text: "MAMA!",
          subtext: "Hype Mode",
          accent: "text-brand-gold"
        };
      case 'urgent':
        return {
          glow: "glow-red",
          border: "border-red-500",
          bg: "from-red-900 to-black",
          text: "MAMA!!!",
          subtext: "Urgent",
          accent: "text-red-400"
        };
      case 'offended':
        return {
          glow: "glow-red",
          border: "border-orange-600",
          bg: "from-orange-950 to-black",
          text: "HABA!",
          subtext: "Offended",
          accent: "text-orange-400"
        };
      case 'thinking':
        return {
          glow: "glow-blue",
          border: "border-sky-500",
          bg: "from-sky-900 to-black",
          text: "MAMA...",
          subtext: "Thinking",
          accent: "text-sky-300"
        };
      case 'celebrate':
        return {
          glow: "glow-purple",
          border: "border-fuchsia-500",
          bg: "from-fuchsia-900 to-black",
          text: "MAMA ✨",
          subtext: "Celebrating!",
          accent: "text-fuchsia-300"
        };
      case 'happy':
        return {
          glow: "glow-emerald",
          border: "border-emerald-400",
          bg: "from-emerald-900 to-black",
          text: "MAMA 😊",
          subtext: "Happy",
          accent: "text-emerald-300"
        };
      case 'reassure':
        return {
          glow: "glow-emerald",
          border: "border-brand-emerald",
          bg: "from-brand-emerald-dark to-black",
          text: "MAMA ❤️",
          subtext: "Reassuring",
          accent: "text-brand-emerald"
        };
      case 'talking':
        return {
          glow: "glow-emerald",
          border: "border-brand-emerald",
          bg: "from-brand-emerald-dark to-black",
          text: "MAMA...",
          subtext: "Speaking",
          accent: "text-brand-emerald"
        };
      case 'shocked':
        return {
          glow: "glow-red",
          border: "border-red-600",
          bg: "from-red-950 to-black",
          text: "WHAT?!",
          subtext: "Shocked",
          accent: "text-red-400"
        };
      default:
        return {
          glow: "glow-emerald",
          border: "border-brand-emerald",
          bg: "from-brand-emerald-dark to-black",
          text: "MAMA",
          subtext: "Neutral",
          accent: "text-brand-emerald"
        };
    }
  };

  const styles = getEmotionStyles();

  return (
    <section className="premium-card relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase ${connected
          ? `bg-brand-emerald/20 ${styles.accent} border border-brand-emerald/30 ${styles.glow}`
          : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${connected ? "bg-brand-emerald animate-pulse" : "bg-red-500"}`} />
          {connected ? (emotion === 'neutral' ? 'Live' : styles.subtext) : "Offline"}
        </span>
      </div>

      <div className="flex flex-col items-center text-center mt-4">
        <h2 className="text-3xl font-bold brand-gradient-text mb-1">Market-Mama</h2>
        <p className="text-sm text-fuchsia-100/60 mb-8 max-w-[280px]">
          {emotion === 'urgent' ? "Wait! This price is too high! Oh my!" :
            emotion === 'hype' ? "Oya! We found a sweet deal!" :
              "Your intelligent, realtime bargaining partner for any shopping flow."}
        </p>

        <div className="relative mb-8">
          {/* Animated Background Rings */}
          {connected && (
            <>
              <div className={`absolute inset-0 rounded-full bg-brand-emerald/20 blur-xl animate-heart-pulse ${emotion === 'urgent' ? 'bg-red-500/30' : ''}`} />
              <div className={`absolute -inset-4 rounded-full border border-brand-emerald/10 animate-[ping_3s_infinite] ${emotion === 'hype' ? 'border-brand-gold/30' : ''}`} />

              {/* Waveform Visualizer */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-10 pointer-events-none">
                <WaveformVisualizer active={connected} color={emotion === 'urgent' ? '#ef4444' : emotion === 'hype' ? '#fbbf24' : '#10b981'} />
              </div>
            </>
          )}

          <div className={`
            w-32 h-32 rounded-full flex items-center justify-center relative z-10
            border-2 transition-all duration-500
            ${connected
              ? `${styles.border} bg-gradient-to-br ${styles.bg} ${styles.glow} scale-105`
              : "border-ui-border bg-ui-glass opacity-50"}
          `}>
            <span className={`text-2xl font-black tracking-tighter ${connected ? "text-white" : "text-fuchsia-100/30"}`}>
              {styles.text}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-panel p-4 border-l-4 border-brand-emerald/50">
          <div className="text-[10px] uppercase tracking-widest text-brand-emerald/70 font-bold mb-1">You said</div>
          <div className="text-sm italic text-fuchsia-100/90 leading-relaxed">
            &quot;{transcript || "Start speaking to use the live agent..."}&quot;
          </div>
        </div>

        <div className={`glass-panel p-4 border-l-4 ${emotion === 'urgent' ? 'border-red-500/50' : emotion === 'hype' ? 'border-brand-gold/50' : 'border-brand-emerald/50'}`}>
          <div className={`text-[10px] uppercase tracking-widest ${styles.accent} font-bold mb-1`}>Mama replied</div>
          <div className="text-sm text-fuchsia-100 leading-relaxed">
            {speech || "Ready to assist you with your shopping flow."}
          </div>
          {typeof confidence === "number" && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${emotion === 'hype' ? 'bg-brand-gold' : 'bg-brand-emerald'} transition-all duration-1000`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className={`text-[10px] ${styles.accent} font-mono`}>{(confidence * 100).toFixed(0)}% Match</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

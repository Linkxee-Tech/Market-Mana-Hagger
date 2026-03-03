"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ensureAnonymousUser } from '../services/authService';
import { useUserStore } from '../store/useUserStore';
import { MamaAvatar } from './MamaAvatar';
import { LeaderboardPanel } from './LeaderboardPanel';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useSession } from '../hooks/useSession';

export default function LandingPage() {
    const router = useRouter();
    const { userId, isAnonymous } = useUserStore();
    const { entries: topSavers, loading: leaderboardLoading } = useLeaderboard();
    const { beginSession } = useSession();
    const [initializing, setInitializing] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                await ensureAnonymousUser();
            } catch (e) {
                console.error("Auth failed but continuing to landing...", e);
            } finally {
                setInitializing(false);
            }
        };
        init();
    }, []);

    const handleStart = async () => {
        // If anonymous (not registered/logged in), redirect to login
        if (!userId || isAnonymous) {
            router.push('/login');
            return;
        }

        setIsStarting(true);
        try {
            const result = await beginSession();
            if (result?.session?.id) {
                router.push(`/session?id=${result.session.id}`);
            } else {
                router.push('/haggle');
            }
        } catch (err) {
            console.error("Failed to start session from landing:", err);
            router.push('/haggle');
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-ui-bg text-foreground overflow-hidden selection:bg-brand-emerald/30">
            {/* Hero Section */}
            <section className="relative pt-20 pb-20 px-4 md:pt-32 md:pb-32 flex flex-col items-center justify-center text-center">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-emerald/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="flex justify-center mb-8 animate-heart-pulse">
                        <MamaAvatar connected={true} emotion="neutral" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
                        Market-Mama <span className="brand-gradient-text">Haggler</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Real-time AI bargaining with a Nigerian market soul. <br className="hidden md:block" />
                        Save money like a pro, win with Mama.
                    </p>

                    <button
                        onClick={handleStart}
                        disabled={isStarting}
                        className={`group relative px-10 py-5 bg-brand-emerald text-white rounded-2xl font-black uppercase tracking-widest text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-95 ${isStarting ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isStarting ? 'Connecting...' : 'Get Started'}
                            {!isStarting && (
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            )}
                        </span>
                    </button>

                    <p className="mt-6 text-xs font-mono text-emerald-500/50 uppercase tracking-widest">
                        {initializing ? "Establishing Neural Connection..." : userId ? `READY_FOR_SESSION_ID: ${userId.slice(0, 8)}` : "IDENTITY_PENDING"}
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-2 h-8 bg-brand-emerald rounded-full glow-emerald" />
                        <h2 className="text-3xl font-black uppercase tracking-tighter">How It Works</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "1. Share View",
                                desc: "Share your shopping tab or upload a screenshot. Mama sees the price immediately.",
                                icon: "🖥️"
                            },
                            {
                                title: "2. Voice Chat",
                                desc: "Haggle in real-time voice. Mama's Nigerian spirit handles the dirty work for you.",
                                icon: "🎙️"
                            },
                            {
                                title: "3. Save Big",
                                desc: "Get coupons, find cheaper tabs, and watch your savings meter explode!",
                                icon: "💰"
                            }
                        ].map((f, i) => (
                            <div key={i} className="premium-card group hover:border-brand-emerald/40">
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leaderboard Preview Section */}
            <section className="py-24 px-4 flex flex-col items-center">
                <div className="max-w-4xl w-full text-center">
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">Today's Top <span className="text-brand-gold">Savers</span></h2>

                    <div className="glass-panel p-8 text-left">
                        <LeaderboardPanel entries={topSavers.slice(0, 5)} loading={leaderboardLoading} />

                        <div className="mt-8 flex justify-center">
                            <Link href="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors uppercase tracking-widest text-sm flex items-center gap-2">
                                View Full Leaderboard
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto py-12 px-4 border-t border-white/5 text-center">
                <p className="text-gray-500 text-sm font-medium">
                    &copy; 2026 Market-Mama Haggler. Built for the future of commerce.
                </p>
            </footer>
        </div>
    );
}

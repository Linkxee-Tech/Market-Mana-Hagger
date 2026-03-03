"use client";

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';
import { LeaderboardPanel } from '../../components/LeaderboardPanel';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Footer } from '../../components/Footer';

export default function FullLeaderboardPage() {
    const { entries, loading } = useLeaderboard(50); // Fetch top 50

    return (
        <div className="min-h-screen flex flex-col bg-ui-bg text-foreground">
            <TopNav theme="dark" showThemeToggle />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-32 pb-24">
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                        Community Registry
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                        Market <span className="text-brand-emerald">Champions</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        See who's out-bargaining the competition. All savings are tracked in real-time by Market-Mama.
                    </p>
                </div>

                <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-emerald/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Top Savers</h3>
                        <span className="text-[10px] font-mono text-emerald-500/50">NETWORK_UPTIME: 99.9%</span>
                    </div>

                    <LeaderboardPanel loading={loading} entries={entries} />
                </div>

                <div className="mt-12 text-center text-xs text-gray-500 font-mono flex flex-col items-center gap-4">
                    <p>WANT TO EARN YOUR SPOT?</p>
                    <Link
                        href="/haggle"
                        className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-brand-emerald hover:text-white hover:border-brand-emerald transition-all duration-300 font-black uppercase tracking-widest"
                    >
                        Start Haggling Now
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}

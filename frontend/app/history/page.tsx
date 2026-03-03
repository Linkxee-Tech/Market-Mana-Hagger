"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav } from '../../components/TopNav';
import { Footer } from '../../components/Footer';
import { useUserStore } from '../../store/useUserStore';
import { getSession } from '../../services/api';
// Assuming the backend has or will have a /api/session/history endpoint, 
// but for the frontend MVP demo, we will check if there's a recent session saved in local storage or global state,
// or show an empty state since the schema currently doesn't expose a listing endpoint.
import { useSessionStore } from '../../store/useSessionStore';

export default function HistoryPage() {
    const router = useRouter();
    const { userId, isAnonymous, _hasHydrated } = useUserStore();
    const { sessionId, savings } = useSessionStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (_hasHydrated) {
            if (!userId) {
                router.push('/login');
            } else {
                setLoading(false);
            }
        }
    }, [userId, _hasHydrated, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-ui-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-emerald"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-ui-bg text-foreground">
            <TopNav theme="dark" showThemeToggle />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-32 pb-24">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black brand-gradient-text uppercase tracking-tighter mb-2">Activity History</h1>
                        <p className="text-gray-400">Review your past haggling sessions and total savings.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Lifetime Savings</div>
                        <div className="text-3xl font-mono text-brand-emerald font-bold">₦{savings.toLocaleString()}</div>
                    </div>
                </header>

                <div className="space-y-4">
                    {/* Mocked History List because backend doesn't have a /api/sessions/list endpoint yet */}
                    {sessionId ? (
                        <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-brand-emerald/30 transition-all cursor-pointer" onClick={() => router.push(`/session?id=${sessionId}`)}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-xl">
                                    🛍️
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Active Market Session</div>
                                    <div className="text-xs font-mono text-white/40">ID: {sessionId.split('-')[0]}... • Just now</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                                <div className="text-right flex-1 md:flex-none">
                                    <div className="text-[10px] uppercase tracking-widest text-white/30">Saved</div>
                                    <div className="font-mono text-brand-emerald font-bold mb-1">₦{savings.toLocaleString()}</div>
                                </div>
                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                    Resume
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
                            <div className="text-6xl mb-4 grayscale opacity-50">🛒</div>
                            <h3 className="text-xl font-bold mb-2">No Past Sessions Found</h3>
                            <p className="text-white/40 mb-8 max-w-md">You haven't haggled with Market-Mama yet. Start a new session to record your savings history.</p>
                            <Link href="/haggle" className="px-8 py-3 bg-brand-emerald text-white rounded-xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                                Start Saving Now
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

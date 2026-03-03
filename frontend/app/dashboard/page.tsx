
"use client";

import { useEffect, useState } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";

export default function Dashboard() {
    const router = useRouter();
    const { userId, _hasHydrated } = useUserStore();
    const { entries, loading } = useLeaderboard();
    const [totalCollectiveSavings, setTotalCollectiveSavings] = useState(0);

    useEffect(() => {
        if (_hasHydrated && !userId && !loading) {
            router.push('/login');
        }
    }, [userId, loading, router, _hasHydrated]);

    useEffect(() => {
        if (entries.length > 0) {
            const total = entries.reduce((acc, curr) => acc + curr.total_savings, 0);
            setTotalCollectiveSavings(total);
        }
    }, [entries]);

    if (!_hasHydrated || (!userId && loading)) {
        return <div className="min-h-screen bg-ui-bg flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-emerald"></div>
        </div>;
    }

    return (
        <main className="min-h-screen flex flex-col gap-6 pb-12">
            <TopNav
                theme="dark"
                showThemeToggle
            />

            <div className="flex-1 px-4 max-w-7xl mx-auto w-full flex flex-col gap-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black brand-gradient-text uppercase tracking-tighter">Market Analytics</h1>
                    <p className="text-fuchsia-100/60 font-medium">Tracking the collective power of smarter bargaining.</p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="premium-card flex flex-col items-center justify-center p-8">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Collective Savings</span>
                        <span className="text-4xl font-black text-brand-emerald">
                            {totalCollectiveSavings.toLocaleString()} <span className="text-sm font-normal">NGN</span>
                        </span>
                    </div>

                    <div className="premium-card flex flex-col items-center justify-center p-8">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Total Bargains Ran</span>
                        <span className="text-4xl font-black text-brand-gold">
                            {entries.length}
                        </span>
                    </div>

                    <div className="premium-card flex flex-col items-center justify-center p-8">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Win Rate</span>
                        <span className="text-4xl font-black text-fuchsia-400">
                            88<span className="text-sm font-normal">%</span>
                        </span>
                    </div>
                </section>

                <section className="premium-card flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter">Recent Successful Negotiatons</h2>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 rounded bg-brand-emerald/10 text-brand-emerald text-[10px] font-bold">LIVE DATA</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="pb-4 pt-2 text-[10px] font-black text-white/30 uppercase tracking-widest">User ID</th>
                                    <th className="pb-4 pt-2 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Savings (NGN)</th>
                                    <th className="pb-4 pt-2 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Date</th>
                                    <th className="pb-4 pt-2 text-[10px) font-black text-white/30 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-white/20">Loading records...</td></tr>
                                ) : entries.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-white/20">No data found yet. Start a session!</td></tr>
                                ) : (
                                    entries.map((entry, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 font-mono text-xs text-fuchsia-100/60 truncate max-w-[120px]">
                                                {entry.user_id}
                                            </td>
                                            <td className="py-4 text-right font-bold text-brand-emerald">
                                                +{entry.total_savings.toLocaleString()}
                                            </td>
                                            <td className="py-4 text-right text-xs text-white/40">
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 flex justify-center">
                                                <span className="px-2 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald text-[9px] font-black uppercase tracking-tighter">COMPLETED</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="premium-card">
                        <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Mood Impact on Deals</h3>
                        <div className="aspect-video bg-white/5 rounded-xl border border-white/10 flex items-center justify-center italic text-white/30 text-sm">
                            Graph showing correlation between Mama's happiness and user savings...
                        </div>
                    </div>
                    <div className="premium-card">
                        <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Persona Popularity</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-white/60">
                                    <span>Ibadan Mama</span>
                                    <span>65%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-emerald w-[65%]" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-white/60">
                                    <span>Lagos Big Aunty</span>
                                    <span>25%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-fuchsia-500 w-[25%]" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-white/60">
                                    <span>Kano Trader</span>
                                    <span>10%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-gold w-[10%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    );
}

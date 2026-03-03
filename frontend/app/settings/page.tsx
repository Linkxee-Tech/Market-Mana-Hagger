"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';
import { useUserStore } from '../../store/useUserStore';
import { logout } from '../../services/authService';

export default function SettingsPage() {
    const router = useRouter();
    const { userId, isAnonymous, micPermission, setMicPermission, screenPermission, setScreenPermission, _hasHydrated } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if not logged in
    React.useEffect(() => {
        if (_hasHydrated && !userId) {
            router.push('/login');
        }
    }, [userId, router, _hasHydrated]);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
            router.push('/');
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-ui-bg text-foreground flex flex-col">
            <TopNav theme="dark" showThemeToggle />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-24">
                <header className="mb-12">
                    <h1 className="text-4xl font-black brand-gradient-text uppercase tracking-tighter mb-2">Account Settings</h1>
                    <p className="text-fuchsia-100/60 font-medium italic">Configure your Market-Mama experience.</p>
                </header>

                <div className="flex flex-col md:grid md:grid-cols-3 gap-8">
                    {/* Profile Section */}
                    <div className="md:col-span-2 flex flex-col gap-6 order-1 md:order-none">
                        <section className="premium-card p-6">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-6">Profile Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">User Identity</label>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="font-mono text-sm text-brand-emerald">
                                            {isAnonymous ? `Trader_${userId.slice(0, 12)}` : userId}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isAnonymous ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-emerald/20 text-brand-emerald'}`}>
                                            {isAnonymous ? 'Guest' : 'Verified'}
                                        </span>
                                    </div>
                                    {isAnonymous && (
                                        <p className="mt-2 text-[10px] text-white/40 italic">You are currently using an anonymous guest account. Register to sync your savings across devices.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="premium-card p-6">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-6">Device Permissions</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                    <div>
                                        <div className="text-sm font-bold mb-1">Microphone Access</div>
                                        <div className="text-[10px] text-white/40">Required for real-time voice haggling.</div>
                                    </div>
                                    <button
                                        onClick={() => setMicPermission(!micPermission)}
                                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${micPermission ? 'bg-brand-emerald' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${micPermission ? 'left-7 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                    <div>
                                        <div className="text-sm font-bold mb-1">Screen Share</div>
                                        <div className="text-[10px] text-white/40">Toggle default screen capture permission.</div>
                                    </div>
                                    <button
                                        onClick={() => setScreenPermission(!screenPermission)}
                                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${screenPermission ? 'bg-brand-emerald' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${screenPermission ? 'left-7 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Sidebar section */}
                    <div className="flex flex-col gap-6 order-2 md:order-none">
                        <div className="premium-card p-6 bg-gradient-to-br from-brand-emerald/10 to-transparent">
                            <div className="w-12 h-12 bg-brand-emerald/20 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🏆</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Member Since</h3>
                            <p className="text-xs text-white/50 mb-4">February 2026</p>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-emerald">Elite Saver</div>
                        </div>

                        <div className="premium-card p-6 flex flex-col gap-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/30">Support</h3>
                            <Link href="/help" className="w-full text-left text-xs font-bold py-2 hover:text-brand-emerald transition-colors">Help Center</Link>
                            <Link href="/privacy" className="w-full text-left text-xs font-bold py-2 hover:text-brand-emerald transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="w-full text-left text-xs font-bold py-2 hover:text-brand-emerald transition-colors">Terms of Service</Link>
                        </div>
                    </div>

                    {/* Danger Zone moved to bottom on mobile, but spans 2 cols on desktop aligned with left content */}
                    <div className="md:col-span-2 order-3 md:order-none">
                        <section className="premium-card p-6 border-red-500/20">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-6 text-red-400">Danger Zone</h2>
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-black uppercase tracking-widest text-xs border border-red-500/30 transition-all hover:scale-[1.01]"
                            >
                                {isLoading ? 'Processing...' : 'Logout from this session'}
                            </button>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

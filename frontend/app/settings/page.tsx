"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';
import { useUserStore } from '../../store/useUserStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { logout } from '../../services/authService';


export default function SettingsPage() {
    const router = useRouter();
    const { userId, isAnonymous, micPermission, setMicPermission, screenPermission, setScreenPermission, _hasHydrated } = useUserStore();
    const { autoAnalyze, setAutoAnalyze, autoHaggle, setAutoHaggle } = useSettingsStore();
    const [isLoading, setIsLoading] = useState(false);
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

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

    const toggleMicTest = async () => {
        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            setMicStream(null);
            setMicPermission(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicStream(stream);
                setMicPermission(true);
                // We keep it on briefly to show it works then maybe stop or let user stop
            } catch (err) {
                console.error("Mic access denied", err);
                setMicPermission(false);
                alert("Microphone access denied. Please check site permissions in your browser.");
            }
        }
    };

    const toggleScreenTest = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            setScreenPermission(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreenStream(stream);
                setScreenPermission(true);
                stream.getVideoTracks()[0].onended = () => {
                    setScreenStream(null);
                    setScreenPermission(false);
                };
            } catch (err) {
                console.error("Screen share denied", err);
                setScreenPermission(false);
            }
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-ui-bg text-foreground flex flex-col font-sans">
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
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${micStream ? 'bg-fuchsia-500 animate-pulse' : 'bg-white/10'}`} />
                                            <div className="text-sm font-bold">Microphone Access</div>
                                        </div>
                                        <div className="text-[10px] text-white/40">Used for real-time voice haggling with Mama.</div>
                                    </div>
                                    <button
                                        onClick={toggleMicTest}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${micStream ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                                    >
                                        {micStream ? 'Stop Test' : 'Request Mic'}
                                    </button>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${screenStream ? 'bg-brand-emerald animate-pulse' : 'bg-white/10'}`} />
                                            <div className="text-sm font-bold">Screen Capture</div>
                                        </div>
                                        <div className="text-[10px] text-white/40">Allows Mama to see your screen for price analysis.</div>
                                    </div>
                                    <button
                                        onClick={toggleScreenTest}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${screenStream ? 'bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                                    >
                                        {screenStream ? 'Stop Test' : 'Request Screen'}
                                    </button>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="text-sm font-bold mb-1">Automation Modes</div>
                                        <div className="text-[10px] text-white/40">Let Mama take the lead on analysis and haggling.</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAutoAnalyze(!autoAnalyze)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${autoAnalyze ? 'bg-brand-emerald text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                        >
                                            Auto Scan: {autoAnalyze ? 'ON' : 'OFF'}
                                        </button>
                                        <button
                                            onClick={() => setAutoHaggle(!autoHaggle)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${autoHaggle ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                        >
                                            Auto Haggle: {autoHaggle ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[10px] text-brand-gold/60 italic px-2 font-medium">
                                    * Permissions are requested by your browser. Market-Mama does not record or store your audio/video.
                                </p>
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

                    {/* Danger Zone */}
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

"use client";

import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-ui-bg text-foreground">
            <TopNav theme="dark" showThemeToggle />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-24">
                <header className="mb-12">
                    <h1 className="text-4xl font-black brand-gradient-text uppercase tracking-tighter mb-4">Privacy Policy</h1>
                    <p className="text-fuchsia-100/60 font-medium tracking-wide">Last updated: March 2026</p>
                </header>

                <div className="space-y-8 text-white/70 leading-relaxed text-sm">
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">1. Data Collection</h2>
                        <p>We collect microphone and screen-sharing data strictly during active "Haggle" sessions. Audio data is streamed temporarily to Google Gemini models for transcription and intent recognition. Screen shares are analyzed to extract product names and prices.</p>
                    </section>

                    <section className="premium-card p-6">
                        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">2. Video & Audio Retention</h2>
                        <p>Market-Mama does not store your live video or audio streams after the session ends. All streaming data is processed in-memory and discarded.</p>
                    </section>

                    <section className="premium-card p-6 border-brand-emerald/20">
                        <h2 className="text-xl font-bold text-brand-emerald mb-4 uppercase tracking-widest">3. Firebase Anonymous Auth</h2>
                        <p>We use Firebase Anonymous Authentication to track your aggregate savings and connect you to the Global Leaderboard without requiring personal emails or passwords immediately. You can choose to link an email later inside your Settings.</p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

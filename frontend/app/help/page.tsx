"use client";

import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import Link from "next/link";

export default function HelpCenterPage() {
    return (
        <div className="min-h-screen flex flex-col bg-ui-bg text-foreground">
            <TopNav theme="dark" showThemeToggle />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-24">
                <header className="mb-12">
                    <h1 className="text-4xl font-black brand-gradient-text uppercase tracking-tighter mb-4">Help Center</h1>
                    <p className="text-fuchsia-100/60 font-medium">Get answers to the most common questions about Market-Mama.</p>
                </header>

                <div className="space-y-6">
                    <div className="premium-card p-6">
                        <h2 className="text-xl font-bold text-brand-emerald mb-2">How do I start a realtime session?</h2>
                        <p className="text-white/70 text-sm">Simply navigate to the "Haggle" page, upload a picture of the product you want, wait for Mama to analyze it, and then click the green "Start Mic" button to begin speaking directly to her.</p>
                    </div>

                    <div className="premium-card p-6">
                        <h2 className="text-xl font-bold text-brand-emerald mb-2">Why is Mama saying "Offline"?</h2>
                        <p className="text-white/70 text-sm">If you lose your internet connection or close your microphone permissions, Mama will momentarily disconnect. Simply refresh the page and reconnect the session.</p>
                    </div>

                    <div className="premium-card p-6 border-brand-gold/20">
                        <h2 className="text-xl font-bold text-brand-gold mb-2">How does the Auto-Haggle work?</h2>
                        <p className="text-white/70 text-sm">Auto-Haggle takes control of your screen sharing session when you are on a shopping website to automatically navigate and find the best checkout path. It requires you to be sharing a browser tab.</p>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-white/40 text-sm mb-4">Still need help?</p>
                        <a href="mailto:support@marketmamahaggler.com" className="text-brand-emerald font-bold hover:underline">Contact Support</a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

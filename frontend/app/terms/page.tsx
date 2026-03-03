"use client";

import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen flex flex-col bg-ui-bg text-foreground">
            <TopNav theme="dark" showThemeToggle />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-24">
                <header className="mb-12">
                    <h1 className="text-4xl font-black brand-gradient-text uppercase tracking-tighter mb-4">Terms of Service</h1>
                    <p className="text-fuchsia-100/60 font-medium tracking-wide">Last updated: March 2026</p>
                </header>

                <div className="space-y-8 text-white/70 leading-relaxed text-sm">
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">1. Experimental AI</h2>
                        <p>Market-Mama is powered by experimental Google Gemini 2.0 Flash multimodal models. While we strive for accuracy, the AI may occasionally hallucinate or provide suboptimal haggling strategies. Use your own discretion before finalizing any purchases.</p>
                    </section>

                    <section className="premium-card p-6 border-brand-gold/20">
                        <h2 className="text-xl font-bold text-brand-gold mb-4 uppercase tracking-widest">2. User Conduct</h2>
                        <p>You agree not to use Market-Mama's automated WebRTC tools to spam, scrape, or otherwise maliciously attack eCommerce platforms. The tool is designed to assist individual shoppers in getting fair pricing.</p>
                    </section>

                    <section className="premium-card p-6 border-red-500/20">
                        <h2 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-widest">3. Financial Liability</h2>
                        <p>Market-Mama and its creators are not financially liable for any purchases made based on the AI's recommendations. The 'savings' calculated in the dashboard are estimates based on scraped comparables and may not represent finalized checkout totals.</p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

"use client";

import Link from 'next/link';
import { MamaAvatar } from '../components/MamaAvatar';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-ui-bg flex flex-col items-center justify-center p-4 text-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-lg w-full">
                <div className="mb-12 flex justify-center scale-110">
                    <MamaAvatar connected={false} emotion="offended" speech="Haba! Where are you going?" />
                </div>

                <h1 className="text-8xl font-black brand-gradient-text tracking-tighter mb-4">404</h1>
                <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest">Page Not Found</h2>

                <p className="text-gray-400 mb-10 leading-relaxed font-medium">
                    Market-Mama is confused. This page does not exist in the market registry.
                    Don't let the deals escape while you're lost!
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-brand-emerald text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Safety
                </Link>
            </div>

            <p className="mt-20 text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">
                ERROR_CODE: PAGE_MISSING_IN_TRANSIT
            </p>
        </div>
    );
}

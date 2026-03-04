'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginEmail } from '../../services/authService';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await loginEmail(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-panel p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold brand-gradient-text mb-2">Welcome Back</h1>
                    <p className="text-sm text-gray-400">Log in to track your savings leaderboard</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest animate-in shake duration-500">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(16,185,129,0.2)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-300" htmlFor="password">
                                Password
                            </label>
                            <Link href="#" className="text-xs text-emerald-400 hover:text-emerald-300">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(16,185,129,0.2)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 flex justify-center rounded-lg font-medium transition-all duration-300 
              ${isLoading ? 'bg-emerald-600/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'} 
              text-white`}
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

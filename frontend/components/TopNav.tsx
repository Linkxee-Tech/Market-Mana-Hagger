"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../services/authService";
import { useUserStore } from "../store/useUserStore";

export type ThemeMode = "light" | "dark";

interface TopNavProps {
  theme?: ThemeMode;
  toggleTheme?: () => void;
  showThemeToggle?: boolean;
}

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Haggle", path: "/haggle" },
  { name: "Leaderboard", path: "/leaderboard" },
  { name: "History", path: "/history" },
];

export function TopNav({ theme, toggleTheme, showThemeToggle }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isAnonymous, _hasHydrated } = useUserStore();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!_hasHydrated) {
    return (
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className="glass-panel mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="text-xl font-black brand-gradient-text">Market-Mama</div>
          <div className="h-6 w-20 bg-white/5 animate-pulse rounded-lg" />
        </div>
      </header>
    );
  }

  return (
    <header className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 ${scrolled ? 'scale-95 px-0 md:px-2' : ''}`}>
      <div className={`glass-panel mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between transition-all duration-300 ${scrolled ? 'shadow-[0_8px_32px_rgba(0,0,0,0.6)] border-brand-emerald/20' : ''}`}>
        <div className="flex items-center gap-2 md:gap-8">
          {pathname !== '/' && (
            <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors p-1" title="Go Back">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <Link
            href="/"
            className="text-lg md:text-xl font-black brand-gradient-text tracking-tight hover:scale-105 transition-transform"
          >
            Market-Mama
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${pathname === item.path
                  ? "text-brand-emerald bg-brand-emerald/10"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {userId ? (
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-brand-emerald">
                  {isAnonymous ? `Trader_${userId.slice(0, 4)}` : userId.slice(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isAnonymous && pathname !== '/register' && (
                  <Link
                    href="/register"
                    className="hidden lg:block px-3 py-1.5 mr-2 rounded-lg bg-brand-gold/10 text-brand-gold text-[9px] font-black uppercase tracking-widest border border-brand-gold/20 hover:bg-brand-gold/20 transition-all"
                  >
                    Register to Save
                  </Link>
                )}
                <Link
                  href="/settings"
                  className={`p-2 rounded-xl transition-all ${pathname === '/settings' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'}`}
                  title="Settings"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/40 transition-all"
                  title="Logout"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:block px-6 py-2 bg-brand-emerald text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
            >
              Sign In
            </Link>
          )}

          {showThemeToggle && toggleTheme && (
            <button
              className="hidden md:block p-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-gold transition-all"
              onClick={toggleTheme}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/70"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 p-4 glass-panel border border-brand-emerald/20 flex flex-col gap-3 rounded-2xl shadow-2xl">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${pathname === item.path
                ? "text-brand-emerald bg-brand-emerald/10"
                : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              {item.name}
            </Link>
          ))}

          <div className="h-px w-full bg-white/10 my-1" />

          <Link
            href="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${pathname === '/settings'
              ? "text-brand-emerald bg-brand-emerald/10"
              : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
          >
            Settings
          </Link>

          {userId ? (
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-center px-4 py-3 mt-2 bg-brand-emerald text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-emerald/20"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

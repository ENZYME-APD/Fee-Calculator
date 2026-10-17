"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/AuthContext';
import { Calculator, Moon, Sun, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingHeader() {
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Only the homepage has a tall hero behind the header worth blending
  // into — every other marketing page (e.g. /wiki) puts real content
  // right at the top, so a transparent header there just overlaps it.
  const isHome = pathname === '/';

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        // Always solid: page content must never show through the header
        "fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 border-b bg-white dark:bg-ink-950",
        (isScrolled || !isHome) ? "border-ink-200 dark:border-ink-800 shadow-sm" : "border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo-dark.png" alt="Enzyme APD" className="h-8 w-auto dark:hidden" />
              <img src="/logo-light.png" alt="Enzyme APD" className="h-8 w-auto hidden dark:block" />
              <div className="h-6 w-px bg-ink-300 dark:bg-ink-700 hidden sm:block"></div>
              <span className="font-bold text-xl text-ink-900 dark:text-ink-50 tracking-tight hidden sm:block">Fee Calculator</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Features</Link>
            <Link href="/#forecast" className="text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Forecast</Link>
            <Link href="/#ai" className="text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">AI</Link>
            <Link href="/#pricing" className="text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Pricing</Link>
            <Link href="/wiki" className="text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Wiki</Link>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {mounted && theme === 'dark' ? <Sun size={20} className="text-warning-400" /> : <Moon size={20} />}
            </button>
            
            {!loading && user ? (
              <Link href="/overview" className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-accent-600/20">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 transition-colors px-2">
                  Log in
                </Link>
                <Link href="/login?signup=true" className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-accent-600/20 hover:-translate-y-0.5">
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-ink-600 dark:text-ink-300">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-ink-950 border-b border-ink-200 dark:border-ink-800 px-4 py-6 space-y-4 shadow-xl">
          <Link href="/#features" className="block text-base font-medium text-ink-900 dark:text-ink-50" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link href="/#forecast" className="block text-base font-medium text-ink-900 dark:text-ink-50" onClick={() => setIsMobileMenuOpen(false)}>Forecast</Link>
          <Link href="/#ai" className="block text-base font-medium text-ink-900 dark:text-ink-50" onClick={() => setIsMobileMenuOpen(false)}>AI</Link>
          <Link href="/#pricing" className="block text-base font-medium text-ink-900 dark:text-ink-50" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/wiki" className="block text-base font-medium text-ink-900 dark:text-ink-50" onClick={() => setIsMobileMenuOpen(false)}>Wiki</Link>
          
          <div className="pt-4 border-t border-ink-100 dark:border-ink-800 flex flex-col gap-3">
            {!loading && user ? (
              <Link href="/overview" className="w-full py-3 text-center bg-accent-600 text-white font-bold rounded-xl shadow-md shadow-accent-600/20" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="w-full py-3 text-center text-ink-900 dark:text-ink-50 border border-ink-200 dark:border-ink-800 font-bold rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
                <Link href="/login?signup=true" className="w-full py-3 text-center bg-accent-600 text-white font-bold rounded-xl shadow-md shadow-accent-600/20" onClick={() => setIsMobileMenuOpen(false)}>Start Free Trial</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

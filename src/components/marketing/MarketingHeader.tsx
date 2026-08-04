"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/AuthContext';
import { Calculator, Moon, Sun, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingHeader() {
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo-dark.png" alt="Enzyme APD" className="h-8 w-auto dark:hidden" />
              <img src="/logo-light.png" alt="Enzyme APD" className="h-8 w-auto hidden dark:block" />
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight hidden sm:block">Fee Calculator</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link>
            <Link href="/#pricing" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link>
            <Link href="/wiki" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Wiki</Link>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mounted && theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
            
            {!loading && user ? (
              <Link href="/overview" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-blue-600/20">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2">
                  Log in
                </Link>
                <Link href="/login?signup=true" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5">
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-6 space-y-4 shadow-xl">
          <Link href="/#features" className="block text-base font-medium text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link href="/#pricing" className="block text-base font-medium text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/wiki" className="block text-base font-medium text-slate-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Wiki</Link>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            {!loading && user ? (
              <Link href="/overview" className="w-full py-3 text-center bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="w-full py-3 text-center text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-bold rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
                <Link href="/login?signup=true" className="w-full py-3 text-center bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20" onClick={() => setIsMobileMenuOpen(false)}>Start Free Trial</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

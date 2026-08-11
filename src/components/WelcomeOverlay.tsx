"use client";
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Users, FolderPlus, UserPlus, BarChart3, FileSpreadsheet, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useTour } from '@/lib/context/TourContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { bootstrapCompanyData } from '@/lib/firebase/db';

export function WelcomeOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoadingTour, setIsLoadingTour] = useState(false);
  const { startTour } = useTour();
  const { user, dbUser } = useAuth();

  useEffect(() => {
    setMounted(true);
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  if (!mounted || !isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDoNotShowAgain = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
          <Sparkles className="absolute text-white/20 w-32 h-32 -right-8 -top-8 rotate-12" />
          <div className="relative z-10 text-center mt-2">
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome to Fee Calculator!</h2>
            <p className="text-blue-100 font-medium mt-1">Let's get you set up for success.</p>
          </div>
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors z-20">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 pb-6 overflow-y-auto min-h-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">Follow these 5 easy steps to create your first fee proposal:</h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 max-w-lg mx-auto">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
              <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">1. Create Team Resources</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Head to the Team Resources tab and add your team members, their roles, and their hourly costs.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl shrink-0">
                <FolderPlus size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">2. Create a Project</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">In the Projects tab, click "New Project" and build your timeline by adding phases (e.g. Design, Construction).</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
              <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 p-2.5 rounded-xl shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">3. Add Resources to Phases</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Open your project and simply drag and drop your team members into the phase lanes to allocate their time.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
              <div className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 p-2.5 rounded-xl shrink-0">
                <BarChart3 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">4. Check the Summaries</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Review the Financial Summary to adjust profit margins, view breakdowns, and see total costs.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">5. Export to Excel</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Click export to generate a clean, ready-to-send Excel or PDF version of your fee proposal.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 pt-4 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
          <Link 
            href="/documentation" 
            onClick={handleClose}
            className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={16} />
            Read Documentation
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDoNotShowAgain}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={async () => {
                if (!dbUser?.companyId || !user?.uid) return;
                setIsLoadingTour(true);
                try {
                  await bootstrapCompanyData(dbUser.companyId, user.uid);
                  localStorage.setItem('hasSeenWelcome', 'true');
                  setIsOpen(false);
                  startTour();
                } catch(e) {
                  console.error(e);
                  setIsLoadingTour(false);
                }
              }}
              disabled={isLoadingTour}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoadingTour ? 'Loading...' : 'Show me around (Tour)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

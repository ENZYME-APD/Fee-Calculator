import React from 'react';
import { MonitorSmartphone, LayoutGrid } from 'lucide-react';

export function MobileBlocker() {
  return (
    <div className="md:hidden fixed inset-0 z-[9999] bg-ink-50 dark:bg-ink-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl shadow-xl border border-ink-200 dark:border-ink-800 flex flex-col items-center max-w-sm">
        <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center text-accent-600 dark:text-accent-400 mb-6">
          <MonitorSmartphone size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-ink-800 dark:text-ink-100 mb-3 tracking-tight">
          Desktop Only
        </h1>
        
        <p className="text-ink-500 dark:text-ink-400 font-medium leading-relaxed mb-6">
          This app is temporarily not available on mobile devices. The complex fee calculation experience is curated specifically for larger horizontal screens.
        </p>
        
        <div className="flex items-center gap-2 text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-950 px-4 py-2 rounded-lg">
          <LayoutGrid size={16} />
          Please open on a Desktop or Tablet
        </div>
      </div>
    </div>
  );
}

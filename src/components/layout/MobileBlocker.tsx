import React from 'react';
import { MonitorSmartphone, LayoutGrid } from 'lucide-react';

export function MobileBlocker() {
  return (
    <div className="md:hidden fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center max-w-sm">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
          <MonitorSmartphone size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
          Desktop Only
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
          This app is temporarily not available on mobile devices. The complex fee calculation experience is curated specifically for larger horizontal screens.
        </p>
        
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg">
          <LayoutGrid size={16} />
          Please open on a Desktop or Tablet
        </div>
      </div>
    </div>
  );
}

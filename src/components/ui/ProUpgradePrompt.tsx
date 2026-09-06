import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProUpgradePromptProps {
  title: string;
  description: string;
}

export function ProUpgradePrompt({ title, description }: ProUpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-6">
          <Lock className="text-blue-600 dark:text-blue-400" size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{title}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {description}
        </p>
        <Link href="/billing">
          <button className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02]">
            <Sparkles size={18} />
            Upgrade to Pro
          </button>
        </Link>
      </div>
    </div>
  );
}

import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProUpgradePromptProps {
  title: string;
  description: string;
}

export function ProUpgradePrompt({ title, description }: ProUpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-ink-50 dark:bg-ink-950">
      <div className="max-w-md bg-white dark:bg-ink-900 rounded-3xl p-10 border border-ink-200 dark:border-ink-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-500 to-info-500"></div>
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-accent-100 to-info-100 dark:from-accent-900/30 dark:to-info-900/30 rounded-full mb-6">
          <Lock className="text-accent-600 dark:text-accent-400" size={32} />
        </div>
        <h2 className="text-2xl font-black text-ink-900 dark:text-ink-50 mb-4">{title}</h2>
        <p className="text-ink-600 dark:text-ink-400 mb-8 leading-relaxed">
          {description}
        </p>
        <Link href="/billing">
          <button className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-accent-600 to-info-600 hover:from-accent-700 hover:to-info-700 shadow-md shadow-accent-900/20 transition-all hover:scale-[1.02]">
            <Sparkles size={18} />
            Upgrade to Pro
          </button>
        </Link>
      </div>
    </div>
  );
}

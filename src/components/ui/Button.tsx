import React from 'react';
import { cn } from '@/lib/utils';

// One primary-button treatment, reused everywhere "the main action on this
// panel" appears — previously this varied from a solid blue button (Projects)
// to a light blue pill (Templates) for the same kind of action.
export function PrimaryButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'h-[38px] px-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'h-[38px] px-3.5 inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
        className
      )}
    >
      {children}
    </button>
  );
}

// One icon-button treatment for row actions — flat, no individual border, a
// single neutral hover background. Row actions pick the hover color by
// context (e.g. rose on delete) via className, but the shape is shared.
export function IconButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400',
        className
      )}
    >
      {children}
    </button>
  );
}

// Shared className for text/number/date inputs and <select>s — one radius,
// one border, one focus ring, instead of px-2/px-3/px-4 py-1.5/2/2.5 mixed
// per instance. Deliberately carries NO width utility: callers that append
// their own (w-20, flex-1, w-full, ...) need it to actually win, and two
// width classes on one element is a specificity tie Tailwind resolves by
// stylesheet order, not call-site order — it silently picked `w-full` over
// `w-20` everywhere that combination was used, collapsing name fields next
// to it. Every call site must append its own width class explicitly.
export const fieldClass =
  'px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors';

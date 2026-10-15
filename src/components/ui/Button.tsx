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
        'h-[38px] px-4 inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
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
        'h-[38px] px-3.5 inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 text-xs font-semibold hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
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
// forwardRef so callers (e.g. RowMenu) can measure the button's screen
// position to place a dropdown.
export const IconButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          'w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-md text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-400',
          className
        )}
      >
        {children}
      </button>
    );
  }
);

// Shared className for text/number/date inputs and <select>s — one radius,
// one border, one focus ring, instead of px-2/px-3/px-4 py-1.5/2/2.5 mixed
// per instance. Deliberately carries NO width utility: callers that append
// their own (w-20, flex-1, w-full, ...) need it to actually win, and two
// width classes on one element is a specificity tie Tailwind resolves by
// stylesheet order, not call-site order — it silently picked `w-full` over
// `w-20` everywhere that combination was used, collapsing name fields next
// to it. Every call site must append its own width class explicitly.
export const fieldClass =
  'px-3 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 rounded-lg text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-colors';

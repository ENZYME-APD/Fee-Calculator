import React from 'react';
import { cn } from '@/lib/utils';

// Single source of truth for project status styling. "Completed" was
// previously blue — the same hue as every primary button and focus ring in
// the app — so it's reassigned to violet here, freeing blue to mean exactly
// one thing: the primary action.
export const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  Draft: { label: 'Draft', dot: 'bg-slate-400 dark:bg-slate-500', text: 'text-slate-500 dark:text-slate-400' },
  Proposed: { label: 'Proposed', dot: 'bg-amber-400 dark:bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  Active: { label: 'Active', dot: 'bg-emerald-400 dark:bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  Completed: { label: 'Completed', dot: 'bg-violet-400 dark:bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
  Lost: { label: 'Lost/Archived', dot: 'bg-rose-400 dark:bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
}

// Light dot + label treatment (replaces the previous heavy colored-background
// pill) — status stays scannable without 5 saturated fills competing on
// screen at once.
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', cfg.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

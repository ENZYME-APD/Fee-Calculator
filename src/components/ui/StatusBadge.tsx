import React from 'react';
import { cn } from '@/lib/utils';

// Single source of truth for project status styling. "Completed" was
// previously blue — the same hue as every primary button and focus ring in
// the app — so it's reassigned to violet here, freeing blue to mean exactly
// one thing: the primary action.
export const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  Draft: { label: 'Draft', dot: 'bg-ink-400 dark:bg-ink-500', text: 'text-ink-500 dark:text-ink-400' },
  Proposed: { label: 'Proposed', dot: 'bg-warning-400 dark:bg-warning-500', text: 'text-warning-600 dark:text-warning-400' },
  Active: { label: 'Active', dot: 'bg-positive-400 dark:bg-positive-500', text: 'text-positive-600 dark:text-positive-400' },
  Completed: { label: 'Completed', dot: 'bg-info-400 dark:bg-info-500', text: 'text-info-600 dark:text-info-400' },
  Lost: { label: 'Lost/archived', dot: 'bg-negative-400 dark:bg-negative-500', text: 'text-negative-600 dark:text-negative-400' },
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
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cfg.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

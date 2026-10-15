import React from 'react';
import { cn } from '@/lib/utils';

// Shared card chrome: one border, one radius, no shadow. Used in place of the
// old per-component "bg-white rounded-2xl border shadow-sm" (and rounded-xl
// shadow-sm hover:shadow-md on nested rows) so every panel in the app reads
// the same way instead of drifting slightly per page.
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl overflow-hidden flex flex-col transition-colors', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4 border-b border-ink-100 dark:border-ink-800', className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex-1 min-h-0', className)}>
      {children}
    </div>
  );
}

// One row treatment: a hairline divider between siblings, no per-row border/
// radius/shadow box. Replaces the "card inside a card" pattern.
export function Row({ className, children, onClick, active }: { className?: string; children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 border-b border-ink-100 dark:border-ink-800 last:border-b-0 group transition-colors',
        onClick && 'cursor-pointer',
        active ? 'bg-accent-50 dark:bg-accent-900/20' : onClick && 'hover:bg-ink-50 dark:hover:bg-ink-800/50',
        className
      )}
    >
      {children}
    </div>
  );
}

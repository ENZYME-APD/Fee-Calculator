import React from 'react';
import { cn } from '@/lib/utils';

// Shared card chrome: one border, one radius, no shadow. Used in place of the
// old per-component "bg-white rounded-2xl border shadow-sm" (and rounded-xl
// shadow-sm hover:shadow-md on nested rows) so every panel in the app reads
// the same way instead of drifting slightly per page.
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col transition-colors', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4 border-b border-slate-100 dark:border-slate-800', className)}>
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
        'flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 group transition-colors',
        onClick && 'cursor-pointer',
        active ? 'bg-blue-50 dark:bg-blue-900/20' : onClick && 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        className
      )}
    >
      {children}
    </div>
  );
}

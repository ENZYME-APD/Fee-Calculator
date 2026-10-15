"use client";
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { getStatusConfig } from './StatusBadge';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['Draft', 'Proposed', 'Active', 'Completed', 'Lost'];

// Same dot+label look as StatusBadge, but an actual <select> — status was
// previously only changeable by opening a project's full edit form, which
// is a lot of friction for what's usually a one-click "move this to Active"
// action. Used wherever a status is shown next to a project.
export function StatusSelect({
  status,
  onChange,
  className,
}: {
  status: string;
  onChange: (status: string) => void;
  className?: string;
}) {
  const cfg = getStatusConfig(status);
  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mr-1.5 pointer-events-none', cfg.dot)} />
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none bg-transparent border-none outline-none text-xs font-medium cursor-pointer pr-3.5 -ml-0.5',
          cfg.text
        )}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="text-ink-900 dark:text-ink-100 bg-white dark:bg-ink-800 normal-case font-medium">
            {s === 'Lost' ? 'Lost/archived' : s}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className={cn('absolute right-0 pointer-events-none', cfg.text)} />
    </div>
  );
}

"use client";
import React from 'react';
import { Plus, X } from 'lucide-react';
import { CommissionShare } from '@/lib/firebase/schema';
import { fieldClass } from '@/components/ui/Button';

/** List of commission shares (person + % of the payment), with a + to add more. */
export function CommissionSharesEditor({ value, onChange, suggestions = [], amount, fmt }: {
  value: CommissionShare[];
  onChange: (next: CommissionShare[]) => void;
  suggestions?: string[];
  amount?: number; // shows each person's cut when given
  fmt?: (n: number) => string;
}) {
  const rows = value.length ? value : [{ name: '', percent: 0 }];
  const set = (i: number, patch: Partial<CommissionShare>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const total = rows.reduce((s, r) => s + (r.percent || 0), 0);
  const listId = 'commission-people';
  return (
    <div className="space-y-2">
      <datalist id={listId}>{suggestions.map(n => <option key={n} value={n} />)}</datalist>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            list={listId}
            value={r.name}
            onChange={e => set(i, { name: e.target.value })}
            placeholder="Person, e.g. Alex Martin"
            aria-label="Commission: person"
            className={`${fieldClass} flex-1 min-w-0 text-xs font-medium`}
          />
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              inputMode="decimal"
              value={r.percent ? String(r.percent) : ''}
              onChange={e => set(i, { percent: Math.min(100, parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0) })}
              placeholder="%"
              aria-label="Commission: percent"
              className={`${fieldClass} w-16 text-xs text-right font-bold`}
            />
            <span className="text-xs font-bold text-ink-500 dark:text-ink-400">%</span>
          </div>
          {amount !== undefined && fmt && (
            <span className="w-20 text-right text-[11px] tabular-nums text-ink-500 dark:text-ink-400 shrink-0">{r.percent ? fmt(Math.round(amount * r.percent / 100)) : ''}</span>
          )}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="p-1 rounded text-ink-500 dark:text-ink-400 hover:text-negative-600 hover:bg-negative-50 dark:hover:bg-negative-900/30 shrink-0"
            title="Remove"
            aria-label="Remove this commission"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange([...rows, { name: '', percent: 0 }])} className="flex items-center gap-1 text-xs font-semibold text-accent-600 dark:text-accent-400 hover:underline">
          <Plus size={12} /> Add person
        </button>
        {rows.filter(r => r.percent).length > 1 && (
          <span className={`text-[11px] font-medium ${total > 100 ? 'text-negative-600 dark:text-negative-400' : 'text-ink-500 dark:text-ink-400'}`}>Total {Math.round(total * 100) / 100}%</span>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import type { suggestLinks } from '@/lib/forecast/collections';

type Suggestion = ReturnType<typeof suggestLinks>[number];

/** Review and confirm links between existing invoices and the Possible / Collections entries copied from them. */
export function LinkReviewModal({ suggestions, fmt, monthLabel, onApply, onClose }: {
  suggestions: Suggestion[];
  fmt: (n: number) => string;
  monthLabel: (m: string) => string;
  onApply: (picked: Suggestion[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(suggestions.map(s => s.entry.pill.id)));
  const toggle = (id: string) => setPicked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const stageName = (st: string) => (st === 'collections' ? 'Collections' : 'Possible');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-start px-5 py-4 border-b border-ink-100 dark:border-ink-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Link entries to their invoices</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Same line and label. Untick any that aren&apos;t the same payment. Nothing moves or changes amount.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto divide-y divide-ink-100 dark:divide-ink-800">
          {suggestions.map(sg => {
            const diff = Math.abs(sg.invoice.pill.amount - sg.entry.pill.amount) >= 1;
            return (
              <label key={sg.entry.pill.id} className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800/40">
                <input type="checkbox" checked={picked.has(sg.entry.pill.id)} onChange={() => toggle(sg.entry.pill.id)} className="accent-[var(--accent-600)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{sg.rowName}</div>
                  <div className="flex items-center gap-2 text-ink-800 dark:text-ink-200">
                    <span className="truncate">{sg.invoice.pill.label}</span>
                  </div>
                </div>
                <div className="text-xs text-right tabular-nums shrink-0">
                  <div className="text-accent-700 dark:text-accent-300">Invoice · {monthLabel(sg.invoice.month)}</div>
                  <div className="font-semibold">{fmt(sg.invoice.pill.amount)}</div>
                </div>
                <ArrowRight size={14} className="text-ink-400 shrink-0" />
                <div className="text-xs text-right tabular-nums shrink-0 w-36">
                  <div className={sg.entry.stage === 'collections' ? 'text-positive-700 dark:text-positive-400' : 'text-warning-700 dark:text-warning-400'}>{stageName(sg.entry.stage)} · {monthLabel(sg.entry.month)}</div>
                  <div className={`font-semibold ${diff ? 'text-warning-700 dark:text-warning-400' : ''}`} title={diff ? 'Different amount from the invoice' : undefined}>{fmt(sg.entry.pill.amount)}</div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex justify-between items-center gap-2 px-5 py-4 border-t border-ink-100 dark:border-ink-800 shrink-0">
          <span className="text-xs text-ink-500 dark:text-ink-400">{picked.size} of {suggestions.length} selected</span>
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="button" disabled={picked.size === 0} onClick={() => onApply(suggestions.filter(sg => picked.has(sg.entry.pill.id)))}>Link {picked.size}</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

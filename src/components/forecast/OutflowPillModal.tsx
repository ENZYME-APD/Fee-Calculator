"use client";
import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ForecastOutflowPill } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

interface OutflowPillModalProps {
  isOpen: boolean;
  lineName: string;
  monthLabel: string;
  pill: ForecastOutflowPill | null; // null = new expense
  onSave: (pill: ForecastOutflowPill) => void;
  onDelete: (pillId: string) => void;
  onClose: () => void;
}

/** Add or edit one expense in an outflow line: amount plus an optional description. */
export function OutflowPillModal({ isOpen, lineName, monthLabel, pill, onSave, onDelete, onClose }: OutflowPillModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setAmount(pill ? String(Math.round(pill.amount * 100) / 100) : '');
    setDescription(pill?.description || '');
  }, [isOpen, pill]);

  if (!isOpen) return null;

  // Whole numbers or up to 2 decimals; thousands separators are added for display only
  const raw = (() => {
    const cleaned = amount.replace(/[^0-9.]/g, '');
    const [int, ...rest] = cleaned.split('.');
    return rest.length ? `${int}.${rest.join('').slice(0, 2)}` : int;
  })();
  const value = Math.round((parseFloat(raw) || 0) * 100) / 100;
  const shown = raw === '' ? '' : (() => {
    const [int, dec] = raw.split('.');
    const intShown = int ? Number(int).toLocaleString('en-US') : '0';
    return dec !== undefined ? `${intShown}.${dec}` : intShown;
  })();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: pill?.id || `opill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: value,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">{pill ? 'Edit expense' : 'Add expense'}</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{lineName} · {monthLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Amount</label>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={shown}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className={`${fieldClass} w-full text-sm font-semibold text-right tabular-nums`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Instalment 3 of 6"
              rows={3}
              className={`${fieldClass} w-full resize-y`}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800">
            {pill ? (
              <button
                type="button"
                onClick={() => { onDelete(pill.id); onClose(); }}
                className="text-negative-600 dark:text-negative-400 hover:underline text-xs flex items-center gap-1 font-medium"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton type="submit">{pill ? 'Save' : 'Add'}</PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

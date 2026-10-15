"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ForecastOutflowItem } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

interface AddOutflowModalProps {
  isOpen: boolean;
  onAdd: (item: ForecastOutflowItem) => void;
  onClose: () => void;
}

export function AddOutflowModal({ isOpen, onAdd, onClose }: AddOutflowModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'debt' | 'partner' | 'burn' | 'custom'>('debt');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: `outflow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      type,
      initialBalance: initialBalance > 0 ? Math.round(initialBalance) : undefined,
      monthlyAmounts: {}, // Will default to monthlyAmount across months if specified
    });

    setName('');
    setInitialBalance(0);
    setMonthlyAmount(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">
              Add outflow / liability line
            </h2>
            <p className="text-xs text-ink-500">Debt repayment, partner profit share, or special expense</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Line item name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Partner 3.0 debt or July loan"
              className={`${fieldClass} w-full text-sm font-semibold`}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Outflow type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className={`${fieldClass} w-full`}
            >
              <option value="debt">Debt / loan repayment</option>
              <option value="partner">Partner distribution / profit share</option>
              <option value="custom">Other monthly expense</option>
            </select>
          </div>

          {type === 'debt' && (
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                Total starting debt balance (no decimals)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={initialBalance === 0 ? '' : initialBalance}
                onChange={e => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setInitialBalance(val);
                }}
                placeholder="e.g. 72000"
                className={`${fieldClass} w-full`}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-800 mt-2">
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Add outflow line
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

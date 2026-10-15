"use client";
import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ForecastPill, ForecastStage } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

interface EditPillModalProps {
  isOpen: boolean;
  pill: ForecastPill | null;
  stage: ForecastStage;
  onSave: (pill: ForecastPill, targetStage: ForecastStage) => void;
  onDelete: (pillId: string) => void;
  onClose: () => void;
}

export function EditPillModal({ isOpen, pill, stage, onSave, onDelete, onClose }: EditPillModalProps) {
  const [amount, setAmount] = useState<number>(pill ? Math.round(pill.amount) : 0);
  const [label, setLabel] = useState<string>(pill ? pill.label : '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(pill?.invoiceNumber || '');
  const [notes, setNotes] = useState<string>(pill?.notes || '');
  const [targetStage, setTargetStage] = useState<ForecastStage>(stage);

  React.useEffect(() => {
    if (pill) {
      setAmount(Math.round(pill.amount || 0));
      setLabel(pill.label || '');
      setInvoiceNumber(pill.invoiceNumber || '');
      setNotes(pill.notes || '');
      setTargetStage(stage);
    } else {
      setAmount(0);
      setLabel('');
      setInvoiceNumber('');
      setNotes('');
      setTargetStage(stage);
    }
  }, [pill, stage, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: pill?.id || `pill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: Math.round(amount),
      label: label.trim() || 'Milestone',
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    }, targetStage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">
              {pill ? 'Edit payment item' : 'New payment item'}
            </h2>
            <p className="text-xs text-ink-500">Milestone / expected invoice</p>
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
              Stage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['possible', 'invoicing', 'collections'] as ForecastStage[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTargetStage(st)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize border transition-all text-center ${
                    targetStage === st
                      ? st === 'possible'
                        ? 'bg-warning-50 text-warning-700 border-warning-400 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-700'
                        : st === 'invoicing'
                        ? 'bg-accent-50 text-accent-700 border-accent-400 dark:bg-accent-950/40 dark:text-accent-300 dark:border-accent-700'
                        : 'bg-positive-50 text-positive-700 border-positive-400 dark:bg-positive-950/40 dark:text-positive-300 dark:border-positive-700'
                      : 'border-ink-200 dark:border-ink-800 text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Amount (no decimals)
            </label>
            <input
              type="number"
              step="1"
              required
              min="0"
              value={amount === 0 ? '' : amount}
              onChange={e => {
                const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                setAmount(val);
              }}
              placeholder="0"
              className={`${fieldClass} w-full text-base font-bold`}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Milestone / label
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. 50% Advance or Final SD"
              className={`${fieldClass} w-full`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                Invoice # (optional)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-104"
                className={`${fieldClass} w-full`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Client wire sent"
                className={`${fieldClass} w-full`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-ink-800 mt-2">
            {pill ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(pill.id);
                  onClose();
                }}
                className="text-xs text-negative-600 hover:text-negative-700 dark:text-negative-400 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-negative-50 dark:hover:bg-negative-950/40 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                {pill ? 'Save changes' : 'Add item'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

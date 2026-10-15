"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ForecastRow } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

interface AddRowModalProps {
  isOpen: boolean;
  onAdd: (row: ForecastRow) => void;
  onClose: () => void;
}

export function AddRowModal({ isOpen, onAdd, onClose }: AddRowModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'project' | 'external' | 'retainer'>('external');
  const [colorTag, setColorTag] = useState<'default' | 'accent' | 'negative' | 'warning' | 'positive'>('negative');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      type,
      colorTag,
      notes: notes.trim() || undefined,
      cells: {},
    });
    setName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">
              Add forecast row
            </h2>
            <p className="text-xs text-ink-500">Custom workstream, external venture, or recurring retainer</p>
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
              Workstream name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Modulnor trasteros or Retail Design advisory"
              className={`${fieldClass} w-full text-sm font-semibold`}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className={`${fieldClass} w-full`}
            >
              <option value="external">External / side partnership</option>
              <option value="retainer">Monthly retainer</option>
              <option value="project">Project / direct work</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Color highlight tag
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'default', label: 'Neutral', bg: 'bg-ink-400' },
                { id: 'accent', label: 'Brand', bg: 'bg-accent-500' },
                { id: 'negative', label: 'Red (External)', bg: 'bg-negative-500' },
                { id: 'warning', label: 'Amber', bg: 'bg-warning-500' },
                { id: 'positive', label: 'Green', bg: 'bg-positive-500' },
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorTag(c.id as any)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    colorTag === c.id
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300'
                      : 'border-ink-200 dark:border-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 10k upfront + 1.5k/month"
              className={`${fieldClass} w-full`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-800 mt-2">
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Create row
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ForecastRow, ForecastGroup } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';
import { GroupPicker } from './groups';

interface EditRowModalProps {
  isOpen: boolean;
  row: ForecastRow | null;
  onSave: (updatedRow: ForecastRow) => void;
  onDelete?: (rowId: string) => void;
  onClose: () => void;
  groups: ForecastGroup[];
  onCreateGroup: (group: ForecastGroup) => void;
}

export function EditRowModal({ isOpen, row, onSave, onDelete, onClose, groups, onCreateGroup }: EditRowModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'project' | 'external' | 'retainer'>('project');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (row) {
      setName(row.name || '');
      setType((row.type as any) || 'project');
      setGroupId(row.groupId);
      setNotes(row.notes || '');
    }
  }, [row]);

  if (!isOpen || !row) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...row,
      name: name.trim(),
      type,
      groupId,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">
              Edit workstream
            </h2>
            <p className="text-xs text-ink-500">Update name, notes, type or group</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Workstream / project name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Riverside Library - Concept design"
              className={`${fieldClass} w-full text-sm font-semibold`}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Description / notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Scope, status, or contract notes"
              className={`${fieldClass} w-full`}
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
              <option value="project">Project / direct work</option>
              <option value="external">External / side partnership</option>
              <option value="retainer">Monthly retainer</option>
            </select>
          </div>

          <GroupPicker groups={groups} value={groupId} onChange={setGroupId} onCreate={onCreateGroup} />

          <div className="flex items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800 mt-2">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(row.id);
                  onClose();
                }}
                className="text-negative-600 dark:text-negative-400 hover:underline text-xs flex items-center gap-1 font-medium"
              >
                <Trash2 size={13} />
                <span>Delete row</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                Save changes
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

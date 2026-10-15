"use client";
import React, { useState } from 'react';
import { TeamMember, TeamCategory } from '@/lib/firebase/schema';
import { X, Check } from 'lucide-react';

interface BulkEditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<TeamMember>) => void;
  selectedCount: number;
  categories: TeamCategory[];
}

export function BulkEditTeamModal({ isOpen, onClose, onSave, selectedCount, categories }: BulkEditTeamModalProps) {
  const [salary, setSalary] = useState('');
  const [overheads, setOverheads] = useState('');
  const [category, setCategory] = useState('');
  const [position, setPosition] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<TeamMember> = {};
    
    if (salary.trim() !== '') updates.salary = parseFloat(salary) || 0;
    if (overheads.trim() !== '') updates.overheads = parseFloat(overheads) || 0;
    if (category.trim() !== '') updates.category = category.trim();
    if (position.trim() !== '') updates.position = position.trim();

    // Recalculate rates if money changed
    if (updates.salary !== undefined || updates.overheads !== undefined) {
      // Note: we can't fully calculate costPerHour without the existing member's data if only one was provided,
      // so we must recalculate it in the parent or handle it by assuming if they change salary/overheads in bulk,
      // they must provide both, or the parent will merge it before saving.
      // Actually, since the db update is partial, we can't compute derived fields in bulk easily using just a single generic update unless we do it per-member.
      // We will let the parent handle the mapping so derived fields (costPerHour) are correct.
    }
    
    onSave(updates);
  };

  return (
    <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-ink-950 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-900">
          <h2 className="text-lg font-bold text-ink-800 dark:text-ink-100">Bulk edit {selectedCount} Members</h2>
          <button onClick={onClose} className="text-ink-500 hover:bg-ink-200 dark:hover:bg-ink-800 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
            Only the fields you fill out below will be updated. Leave fields blank to keep the existing values for each member.
          </p>

          <div>
            <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:ring-2 focus:ring-accent-500/20 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50"
            >
              <option value="">(Leave blank to keep existing)</option>
              {categories.filter(c => !c.isFixed).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1.5">Position / role</label>
            <input 
              type="text" 
              value={position} 
              onChange={e => setPosition(e.target.value)} 
              placeholder="Leave blank to keep existing"
              className="w-full px-4 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:ring-2 focus:ring-accent-500/20 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50"
            />
          </div>
          

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1.5">Salary/mo</label>
              <input 
                type="number" 
                value={salary} 
                onChange={e => setSalary(e.target.value)} 
                placeholder="Unchanged"
                className="w-full px-4 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:ring-2 focus:ring-accent-500/20 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1.5">Overheads/mo</label>
              <input 
                type="number" 
                value={overheads} 
                onChange={e => setOverheads(e.target.value)} 
                placeholder="Unchanged"
                className="w-full px-4 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:ring-2 focus:ring-accent-500/20 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-ink-100 dark:border-ink-800">
            <button type="button" onClick={onClose} className="px-5 py-2 text-ink-600 dark:text-ink-400 font-medium hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors">
              <Check size={18} /> Apply Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

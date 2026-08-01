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
      // We will let the parent handle the mapping so derived fields (costPerHour, roundedFeeHour) are correct.
    }
    
    onSave(updates);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bulk Edit {selectedCount} Members</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Only the fields you fill out below will be updated. Leave fields blank to keep the existing values for each member.
          </p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">(Leave blank to keep existing)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Position / Role</label>
            <input 
              type="text" 
              value={position} 
              onChange={e => setPosition(e.target.value)} 
              placeholder="Leave blank to keep existing"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Salary/Mo</label>
              <input 
                type="number" 
                value={salary} 
                onChange={e => setSalary(e.target.value)} 
                placeholder="Unchanged"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Overheads/Mo</label>
              <input 
                type="number" 
                value={overheads} 
                onChange={e => setOverheads(e.target.value)} 
                placeholder="Unchanged"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors">
              <Check size={18} /> Apply Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { TeamMember, TeamCategory } from '@/lib/firebase/schema';
import { addTeamMember, updateTeamMember, getCategories, getOverheadsProfile } from '@/lib/firebase/db';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { X, Save, UserCircle2, Briefcase, Calculator, Building, Tag } from 'lucide-react';

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: TeamMember;
}

export function TeamMemberForm({ isOpen, onClose, onSaved, initialData }: TeamMemberFormProps) {
  const { currencyCode } = useAppSettings();
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    position: '',
    type: 'Employee',
    salary: 0,
    overheads: 0,
    costPerHour: 0,
    currency: 'USD',
    category: ''
  });
  
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [calculatedOverhead, setCalculatedOverhead] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCategories().then(data => {
        setCategories(data.sort((a, b) => a.order - b.order));
      });
    }
    
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '', position: '', type: 'Employee', salary: 0, overheads: 0, costPerHour: 0, currency: 'USD', category: ''
      });
    }
  }, [initialData, isOpen]);

  // Auto-calculate cost per hour based on 40h/week (roughly 160h/month)
  const handleFinancialChange = (field: 'salary' | 'overheads', value: number) => {
    const newSalary = field === 'salary' ? value : (formData.salary || 0);
    const newOverheads = field === 'overheads' ? value : (formData.overheads || 0);
    
    // (Salary + Overheads) / (40 hours * 4 weeks)
    const baseCost = (newSalary + newOverheads) / 160;
    
    setFormData({
      ...formData,
      [field]: value,
      costPerHour: baseCost,
      ...(field === 'overheads' ? { isOverheadsManuallyOverridden: true } : {})
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateTeamMember(initialData.id, formData as TeamMember);
      } else {
        await addTeamMember(formData as Omit<TeamMember, 'id'>);
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-ink-100 dark:border-ink-800">
        <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800">
          <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">{initialData ? 'Edit' : 'Add'} Team Member</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Full name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Position</label>
              <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Category</label>
              <select
                value={formData.category || ''}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
              >
                <option value="">-- Select category --</option>
                {categories.filter(c => !c.isFixed).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Monthly salary ({currencyCode})</label>
              <input required type="number" min="0" value={formData.salary} onChange={e => handleFinancialChange('salary', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300">Monthly overheads ({currencyCode})</label>
                {formData.isOverheadsManuallyOverridden && calculatedOverhead !== null && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const baseCost = (formData.salary! + calculatedOverhead) / 160;
                      setFormData({ ...formData, overheads: calculatedOverhead, isOverheadsManuallyOverridden: false, costPerHour: baseCost });
                    }}
                    className="text-xs font-bold text-accent-500 hover:text-accent-600 transition-colors"
                  >
                    Reset to Sync
                  </button>
                )}
              </div>
              <input required type="number" min="0" value={formData.overheads} onChange={e => handleFinancialChange('overheads', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Cost / hour ({currencyCode})</label>
              <input readOnly type="number" step="0.01" value={formData.costPerHour} className="w-full px-3 py-2 border border-negative-200 dark:border-negative-900/30 bg-negative-50/70 dark:bg-negative-950/70 text-negative-700 dark:text-negative-400 rounded-xl focus:outline-none cursor-not-allowed opacity-80" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-ink-100 dark:border-ink-800 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-accent-600 dark:bg-accent-600 hover:bg-accent-700 dark:hover:bg-accent-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-accent-600/20">
              {loading ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { TeamMember } from '@/lib/firebase/schema';
import { addTeamMember, updateTeamMember } from '@/lib/firebase/db';
import { X } from 'lucide-react';

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: TeamMember;
}

export function TeamMemberForm({ isOpen, onClose, onSaved, initialData }: TeamMemberFormProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    position: '',
    type: 'Employee',
    salary: 0,
    overheads: 0,
    costPerHour: 0,
    roundedFeeHour: 0,
    currency: 'USD',
    category: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '', position: '', type: 'Employee', salary: 0, overheads: 0, costPerHour: 0, roundedFeeHour: 0, currency: 'USD', category: ''
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
      costPerHour: parseFloat(baseCost.toFixed(2)),
      roundedFeeHour: parseFloat((baseCost * 2.5).toFixed(2)) // Default 2.5x multiplier based on their sheet
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{initialData ? 'Edit' : 'Add'} Team Member</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Position</label>
              <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <input 
                type="text" 
                list="member-categories" 
                value={formData.category || ''} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                placeholder="e.g. MANAGEMENT"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
              <datalist id="member-categories">
                <option value="MANAGEMENT" />
                <option value="TEAM GLOBAL" />
                <option value="TEAM JAKARTA" />
                <option value="CONSULTANTS" />
              </datalist>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="Employee">Employee</option>
                <option value="Consultant">Consultant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Salary</label>
              <input required type="number" min="0" value={formData.salary === 0 ? '' : formData.salary} onChange={e => handleFinancialChange('salary', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Overheads</label>
              <input required type="number" min="0" value={formData.overheads === 0 ? '' : formData.overheads} onChange={e => handleFinancialChange('overheads', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost / Hour (USD)</label>
              <input required type="number" step="0.01" value={formData.costPerHour === 0 ? '' : formData.costPerHour} onChange={e => setFormData({...formData, costPerHour: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-xl focus:ring-2 focus:ring-rose-500/20" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fee / Hour (USD)</label>
              <input required type="number" step="0.01" value={formData.roundedFeeHour === 0 ? '' : formData.roundedFeeHour} onChange={e => setFormData({...formData, roundedFeeHour: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">
              {loading ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Phase, ProjectCost } from '@/lib/firebase/schema';
import { X, Palette, Plane, Briefcase, Receipt } from 'lucide-react';
import { useAppSettings } from '@/lib/auth/AuthContext';

interface CostModalProps {
  isOpen: boolean;
  type: 'rendering' | 'trip' | 'consultant' | 'other' | null;
  phase: Phase | null;
  initialData?: ProjectCost | null;
  onClose: () => void;
  onSave: (data: Omit<ProjectCost, 'id' | 'projectId' | 'phaseId' | 'companyId'>) => Promise<void>;
}

export function CostModal({ isOpen, type, phase, initialData, onClose, onSave }: CostModalProps) {
  const { formatCurrency, currencyCode } = useAppSettings();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setQuantity(initialData.quantity);
      setUnitCost(initialData.unitCost);
    } else {
      if (type === 'rendering') {
        setName('Rendering');
        setUnitCost(250);
      } else if (type === 'trip') {
        setName('Trip');
        setUnitCost(1500);
      } else if (type === 'consultant') {
        setName('Landscape Consultant');
        setUnitCost(0);
      } else if (type === 'other') {
        setName('Software / Miscellaneous');
        setUnitCost(0);
      }
      
      setQuantity(1);
    }
  }, [type, isOpen, initialData]);

  if (!isOpen || !type || !phase) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({
      type,
      name,
      quantity,
      unitCost
    });
    setLoading(false);
    onClose();
  };

  const isLumpSum = type === 'consultant' || type === 'other';

  const icons = {
    rendering: <Palette className="text-clay-500" size={24} />,
    trip: <Plane className="text-accent-500" size={24} />,
    consultant: <Briefcase className="text-info-500" size={24} />,
    other: <Receipt className="text-positive-500" size={24} />
  };

  const titles = {
    rendering: 'Add Rendering Cost',
    trip: 'Add Trip Cost',
    consultant: 'Add Consultant',
    other: 'Add Other Cost'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="bg-ink-50 dark:bg-ink-800 p-2 rounded-xl">
              {icons[type]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">{initialData ? 'Edit Cost' : titles[type]}</h2>
              <p className="text-sm font-medium text-ink-500 dark:text-ink-400">For phase: <span className="text-ink-700 dark:text-ink-300">{phase.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-ink-50/50 dark:bg-ink-950/50">
          <div>
            <label className="block text-sm font-bold text-ink-700 dark:text-ink-300 mb-1.5">
              {type === 'consultant' ? 'Consultant Name / Service' : type === 'other' ? 'Expense Description' : 'Description'}
            </label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-4 py-2.5 border border-ink-200 dark:border-ink-700 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 bg-white dark:bg-ink-900 text-ink-800 dark:text-ink-200 font-medium" 
            />
          </div>

          <div className="flex gap-4">
            {!isLumpSum && (
              <div className="flex-1">
                <label className="block text-sm font-bold text-ink-700 dark:text-ink-300 mb-1.5">
                  Number of {type}s
                </label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  value={quantity === 0 ? '' : quantity} 
                  onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                  className="w-full px-4 py-2.5 border border-ink-200 dark:border-ink-700 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 bg-white dark:bg-ink-900 font-medium text-ink-700 dark:text-ink-200" 
                />
              </div>
            )}
            
            <div className="flex-1">
              <label className="block text-sm font-bold text-ink-700 dark:text-ink-300 mb-1.5">
                {isLumpSum ? `Lump Sum Cost (${currencyCode})` : `Unit Cost (${currencyCode})`}
              </label>
              <input 
                required 
                type="number" 
                min="0"
                step="0.01"
                value={unitCost === 0 ? '' : unitCost} 
                onChange={e => setUnitCost(parseFloat(e.target.value) || 0)} 
                className="w-full px-4 py-2.5 border border-negative-200 dark:border-negative-900/30 bg-negative-50 dark:bg-negative-500/10 rounded-xl focus:ring-2 focus:ring-negative-500/20 focus:border-negative-500 font-bold text-negative-700 dark:text-negative-400" 
              />
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-xl flex justify-between items-center shadow-sm">
            <span className="text-sm font-semibold text-ink-500 dark:text-ink-400">Total added cost</span>
            <div className="text-xl font-black text-ink-800 dark:text-ink-200">
              {formatCurrency(quantity * unitCost)}
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-800 rounded-xl transition-colors bg-ink-100 dark:bg-ink-900">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-bold text-white bg-ink-800 dark:bg-accent-600 hover:bg-ink-900 dark:hover:bg-accent-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm">
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Add Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

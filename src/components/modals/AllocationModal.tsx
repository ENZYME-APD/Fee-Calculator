import React, { useState } from 'react';
import { TeamMember, Phase, Allocation } from '@/lib/firebase/schema';
import { X, Clock, CalendarDays, Percent } from 'lucide-react';

interface AllocationModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  phase: Phase | null;
  initialData?: Allocation | null;
  onClose: () => void;
  onSave: (data: Omit<Allocation, 'id' | 'phaseId' | 'memberId' | 'companyId' | 'projectId'>) => void;
}

export function AllocationModal({ isOpen, member, phase, initialData, onClose, onSave }: AllocationModalProps) {
  const [allocationType, setAllocationType] = useState<'hours' | 'weeks' | 'percentage'>('hours');
  const [allocationValue, setAllocationValue] = useState<string>('');

  React.useEffect(() => {
    if (initialData && isOpen) {
      setAllocationType(initialData.allocationType);
      setAllocationValue(initialData.allocationValue.toString());
    } else if (!isOpen) {
      setAllocationValue('');
      setAllocationType('hours');
    }
  }, [initialData, isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !member || !phase) return null;

  // Calculate standard hours based on input
  const val = parseFloat(allocationValue) || 0;
  let finalHours = 0;
  
  if (allocationType === 'hours') {
    finalHours = val;
  } else if (allocationType === 'weeks') {
    finalHours = val * 40; // 40h standard week
  } else if (allocationType === 'percentage') {
    finalHours = (val / 100) * phase.durationWeeks * 40;
  }

  const finalCost = finalHours * member.costPerHour;

  const handleSave = () => {
    if (val > 0) {
      onSave({
        allocationType,
        allocationValue: val,
        hours: finalHours
      });
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-ink-100 dark:border-ink-800">
        <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
          <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">{initialData ? 'Edit Allocation' : 'Allocate Resource'}</h2>
          <button onClick={handleClose} className="text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-300 p-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 bg-ink-50/50 dark:bg-ink-950/50">
          <div className="mb-6 p-5 bg-white dark:bg-ink-900 rounded-2xl flex flex-col gap-3 border border-ink-200 dark:border-ink-800 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-ink-500 dark:text-ink-400">Team member</span>
              <span className="font-bold text-ink-800 dark:text-ink-200">{member.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-ink-500 dark:text-ink-400">Project phase</span>
              <div className="flex flex-col items-end">
                <span className="font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30 px-2 py-0.5 rounded-md">{phase.name}</span>
                <span className="text-[10px] text-ink-500 font-medium mt-1">{phase.durationWeeks} weeks total</span>
              </div>
            </div>
            <div className="w-full h-px bg-ink-100 dark:bg-ink-800 my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-ink-500 dark:text-ink-400">Cost rate</span>
              <span className="font-semibold text-ink-700 dark:text-ink-300">${member.costPerHour}/hr</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-ink-700 dark:text-ink-300">Allocation input</label>
            <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-xl">
              <button onClick={() => setAllocationType('hours')} className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${allocationType === 'hours' ? 'bg-white text-accent-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
                <Clock size={16} /> Hours
              </button>
              <button onClick={() => setAllocationType('weeks')} className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${allocationType === 'weeks' ? 'bg-white text-accent-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
                <CalendarDays size={16} /> Weeks
              </button>
              <button onClick={() => setAllocationType('percentage')} className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${allocationType === 'percentage' ? 'bg-white text-accent-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
                <Percent size={16} /> % Load
              </button>
            </div>
            
            <input
              type="number"
              min="0"
              step="0.5"
              value={allocationValue}
              onChange={(e) => setAllocationValue(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-ink-200 dark:border-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all bg-white dark:bg-ink-900 text-ink-800 dark:text-ink-200 font-bold text-lg shadow-sm"
              placeholder={allocationType === 'percentage' ? 'e.g. 50 (for 50%)' : `e.g. ${allocationType === 'weeks' ? '2' : '40'}`}
              autoFocus
            />
          </div>

          {val > 0 && (
            <div className="mt-6 p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl border border-accent-100 dark:border-accent-900/30 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-accent-700 dark:text-accent-400 font-medium">Calculated hours</span>
                <span className="font-bold text-accent-900 dark:text-accent-300">{finalHours.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-accent-700 dark:text-accent-400 font-medium">Estimated cost</span>
                <span className="font-bold text-negative-600 dark:text-negative-400">${finalCost.toLocaleString()}</span>
              </div>

            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 flex justify-end gap-3">
          <button 
            onClick={handleClose}
            className="px-6 py-2.5 text-sm font-bold text-ink-600 dark:text-ink-300 hover:text-ink-800 dark:hover:text-ink-50 hover:bg-ink-100 dark:hover:bg-ink-800 bg-white dark:bg-ink-900 rounded-xl transition-colors border border-ink-200 dark:border-ink-700 shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={val <= 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-accent-600/20 active:scale-95"
          >
            {initialData ? 'Save Changes' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

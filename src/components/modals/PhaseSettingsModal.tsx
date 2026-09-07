import React, { useState, useEffect } from 'react';
import { Phase } from '@/lib/firebase/schema';

interface PhaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  phase: Phase | null;
  onSave: (id: string, updates: Partial<Phase>) => Promise<void>;
}

export function PhaseSettingsModal({ isOpen, onClose, phase, onSave }: PhaseSettingsModalProps) {
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [omissions, setOmissions] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && phase) {
      setName(phase.name);
      setDurationWeeks(phase.durationWeeks.toString());
      setDescription(phase.description || '');
      setTasks(phase.tasks || '');
      setInclusions(phase.inclusions || '');
      setOmissions(phase.omissions || '');
      setDeliverables(phase.deliverables || '');
    }
  }, [isOpen, phase]);

  if (!isOpen || !phase) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave(phase.id!, {
        name: name.trim(),
        durationWeeks: parseFloat(durationWeeks) || 1,
        description: description.trim(),
        tasks: tasks.trim(),
        inclusions: inclusions.trim(),
        omissions: omissions.trim(),
        deliverables: deliverables.trim()
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Phase: {phase.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="phase-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phase Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Duration (Weeks)</label>
                <input required type="number" min="0.5" step="0.5" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this phase..." className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tasks</label>
                <textarea rows={3} value={tasks} onChange={e => setTasks(e.target.value)} placeholder="- Task 1&#10;- Task 2" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Deliverables</label>
                <textarea rows={3} value={deliverables} onChange={e => setDeliverables(e.target.value)} placeholder="- PDF Report&#10;- BIM Model" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Inclusions</label>
                <textarea rows={3} value={inclusions} onChange={e => setInclusions(e.target.value)} placeholder="- Included item 1" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Omissions</label>
                <textarea rows={3} value={omissions} onChange={e => setOmissions(e.target.value)} placeholder="- Excluded item 1" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white resize-none" />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" form="phase-form" disabled={isSaving} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}

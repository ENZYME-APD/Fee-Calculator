"use client";
import React, { useState, useEffect } from 'react';
import { ProjectTask, Phase, TeamMember } from '@/lib/firebase/schema';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface EditTaskModalProps {
  task: ProjectTask;
  phases: Phase[];
  members: TeamMember[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<ProjectTask>) => void;
  onDelete: (id: string) => void;
}

export function EditTaskModal({ task, phases, members, onClose, onSave, onDelete }: EditTaskModalProps) {
  const [name, setName] = useState(task.name);
  const [durationHours, setDurationHours] = useState(task.durationHours);
  const [memberId, setMemberId] = useState(task.memberId || '');
  const [phaseId, setPhaseId] = useState(task.phaseId);
  const [startDate, setStartDate] = useState(format(new Date(task.startDate), 'yyyy-MM-dd'));
  const [includeWeekends, setIncludeWeekends] = useState(task.includeWeekends);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id!, {
      name,
      durationHours: Number(durationHours),
      memberId: memberId || undefined,
      phaseId,
      startDate: new Date(startDate).getTime(),
      includeWeekends
    });
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-ink-900 rounded-2xl w-full max-w-md shadow-xl border border-ink-200 dark:border-ink-800 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-ink-100 dark:border-ink-800 flex justify-between items-center bg-ink-50 dark:bg-ink-900">
          <h2 className="text-xl font-bold text-ink-800 dark:text-ink-100">Edit task</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1">Task name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1">Duration (hours)</label>
              <input 
                type="number" 
                required
                min="1"
                step="0.5"
                value={durationHours}
                onChange={e => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1">Start date</label>
              <input 
                type="date" 
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1">Phase</label>
              <select 
                required
                value={phaseId}
                onChange={e => setPhaseId(e.target.value)}
                className="w-full px-3 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200"
              >
                {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1">Team member</label>
              <select 
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200"
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input 
              type="checkbox" 
              checked={includeWeekends}
              onChange={e => setIncludeWeekends(e.target.checked)}
              className="rounded text-accent-600 focus:ring-accent-500 w-4 h-4"
            />
            <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">Include weekends</span>
          </label>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-ink-100 dark:border-ink-800">
            <button 
              type="button" 
              onClick={() => onDelete(task.id!)}
              className="px-4 py-2 text-negative-600 hover:bg-negative-50 dark:hover:bg-negative-900/30 rounded-lg font-semibold transition-colors"
            >
              Delete Task
            </button>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-bold shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

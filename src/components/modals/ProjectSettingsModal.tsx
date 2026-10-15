import React, { useState, useEffect } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { Project } from '@/lib/firebase/schema';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => Promise<void>;
}

export function ProjectSettingsModal({ isOpen, project, onClose, onSave }: ProjectSettingsModalProps) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status || 'Draft');
  const [area, setArea] = useState(project.area?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setStatus(project.status || 'Draft');
      setArea(project.area?.toString() || '');
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        status,
        area: area ? parseFloat(area) : undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800">
            <div className="flex items-center gap-3">
              <div className="bg-accent-100 dark:bg-accent-900/30 p-2 rounded-xl text-accent-600 dark:text-accent-400">
                <Settings size={24} />
              </div>
              <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">Project settings</h2>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 bg-ink-50/50 dark:bg-ink-950/50 space-y-4">
            <div>
              <label className="block text-sm font-bold text-ink-700 dark:text-ink-300 mb-1.5">Project name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl focus:ring-2 focus:ring-accent-500/20 outline-none text-ink-900 dark:text-ink-50 transition-all shadow-sm font-semibold"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-ink-700 dark:text-ink-300 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl focus:ring-2 focus:ring-accent-500/20 outline-none text-ink-900 dark:text-ink-50 transition-all shadow-sm font-semibold appearance-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Proposed">Proposed</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Lost">Lost/archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-700 dark:text-ink-300 mb-1.5">Project area</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl focus:ring-2 focus:ring-accent-500/20 outline-none text-ink-900 dark:text-ink-50 transition-all shadow-sm font-semibold"
                />
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-ink-100 dark:border-ink-800 flex justify-end gap-3 bg-white dark:bg-ink-900">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-accent-600 hover:bg-accent-700 shadow-md shadow-accent-600/20 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Check size={18} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

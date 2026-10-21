import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Wand2 } from 'lucide-react';
import { Project, ProposalDetails } from '@/lib/firebase/schema';
import { getProjects } from '@/lib/firebase/db';
import { useAuth } from '@/lib/auth/AuthContext';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => Promise<void>;
  /** Open with the proposal details in view (from the Document builder). */
  focusProposal?: boolean;
}

const input = 'w-full px-3 py-2.5 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl focus:ring-2 focus:ring-accent-500/20 outline-none text-sm text-ink-900 dark:text-ink-50 transition-all shadow-sm';
const label = 'block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1';

const toDateInput = (ts?: number) => (ts ? new Date(ts).toISOString().slice(0, 10) : '');
const fromDateInput = (v: string) => (v ? Date.parse(`${v}T09:00:00Z`) : undefined);

/** Next free reference for this year: PREFIX-YYNNN, e.g. QU-26014. */
async function nextReference(prefix: string, currentId?: string): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(-2);
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${yy}(\\d{3})`, 'i');
  const projects = await getProjects();
  let max = 0;
  projects.forEach(p => {
    if (p.id === currentId) return;
    const m = (p.proposal?.ref || '').match(re);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `${prefix}-${yy}${String(max + 1).padStart(3, '0')}`;
}

export function ProjectSettingsModal({ isOpen, project, onClose, onSave, focusProposal }: ProjectSettingsModalProps) {
  const { dbCompany } = useAuth();
  const defaults = dbCompany?.proposal || {};
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status || 'Draft');
  const [area, setArea] = useState(project.area?.toString() || '');
  const [prop, setProp] = useState<ProposalDetails>(project.proposal || {});
  const [isSaving, setIsSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setStatus(project.status || 'Draft');
      setArea(project.area?.toString() || '');
      setProp(project.proposal || {});
      if (focusProposal) setTimeout(() => document.getElementById('proposal-details')?.scrollIntoView({ block: 'start' }), 50);
    }
  }, [isOpen, project, focusProposal]);

  if (!isOpen) return null;

  const set = <K extends keyof ProposalDetails>(k: K, v: ProposalDetails[K]) => setProp(p => ({ ...p, [k]: v }));

  const generateRef = async () => {
    setGenerating(true);
    try {
      set('ref', await nextReference((defaults.refPrefix || 'QU').trim(), project.id));
      if (!prop.revision) set('revision', '01');
      if (!prop.issueDate) set('issueDate', Date.now());
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(prop).filter(([, v]) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim()) && !(typeof v === 'number' && Number.isNaN(v)))) as ProposalDetails;
      await onSave({
        name: name.trim(),
        status,
        area: area ? parseFloat(area) : undefined,
        proposal: cleaned,
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
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800 shrink-0">
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

          <div className="p-6 bg-ink-50/50 dark:bg-ink-950/50 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className={label}>Project name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${input} font-semibold`} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${input} font-semibold appearance-none`}>
                    <option value="Draft">Draft</option>
                    <option value="Proposed">Proposed</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Lost">Lost/archived</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Project area</label>
                  <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 5000" className={input} />
                </div>
              </div>
            </div>

            <div id="proposal-details" className="space-y-4 pt-2 border-t border-ink-200 dark:border-ink-800 scroll-mt-4">
              <div className="pt-4">
                <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200">Proposal details</h3>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Used to fill fields like {'{{client}}'} and {'{{ref}}'} in the Document builder.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={label}>Client</label>
                  <input value={prop.client || ''} onChange={e => set('client', e.target.value)} placeholder="e.g. Emaar India" className={input} />
                </div>
                <div>
                  <label className={label}>Attention: name</label>
                  <input value={prop.attnName || ''} onChange={e => set('attnName', e.target.value)} placeholder="e.g. Mr. Das" className={input} />
                </div>
                <div>
                  <label className={label}>Attention: title</label>
                  <input value={prop.attnTitle || ''} onChange={e => set('attnTitle', e.target.value)} placeholder="e.g. Head of Business Development" className={input} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Client address</label>
                  <textarea rows={2} value={prop.clientAddress || ''} onChange={e => set('clientAddress', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>Country</label>
                  <input value={prop.country || ''} onChange={e => set('country', e.target.value)} placeholder="e.g. India" className={input} />
                </div>
                <div>
                  <label className={label}>Issue date</label>
                  <input type="date" value={toDateInput(prop.issueDate)} onChange={e => set('issueDate', fromDateInput(e.target.value))} className={input} />
                </div>
                <div>
                  <label className={label}>Reference</label>
                  <div className="flex gap-2">
                    <input value={prop.ref || ''} onChange={e => set('ref', e.target.value)} placeholder={`e.g. ${(defaults.refPrefix || 'QU')}-26001`} className={input} />
                    <button type="button" onClick={generateRef} disabled={generating} title="Next free reference for this year"
                      className="shrink-0 px-3 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-60">
                      <Wand2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Revision</label>
                    <input value={prop.revision || ''} onChange={e => set('revision', e.target.value)} placeholder="01" className={input} />
                  </div>
                  <div>
                    <label className={label}>Validity (days)</label>
                    <input type="number" value={prop.validityDays ?? ''} onChange={e => set('validityDays', e.target.value ? Number(e.target.value) : undefined)} placeholder={defaults.validityDays ? String(defaults.validityDays) : '60'} className={input} />
                  </div>
                </div>
                <div>
                  <label className={label}>Signatory</label>
                  <input value={prop.signatoryName || ''} onChange={e => set('signatoryName', e.target.value)} placeholder={defaults.signatoryName || 'Company default'} className={input} />
                </div>
                <div>
                  <label className={label}>Signatory title</label>
                  <input value={prop.signatoryTitle || ''} onChange={e => set('signatoryTitle', e.target.value)} placeholder={defaults.signatoryTitle || 'Company default'} className={input} />
                </div>
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Signatory, validity, bank details and rates default to Settings → Proposals.</p>
            </div>
          </div>

          <div className="p-6 border-t border-ink-100 dark:border-ink-800 flex justify-end gap-3 bg-white dark:bg-ink-900 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-accent-600 hover:bg-accent-700 shadow-md shadow-accent-600/20 transition-colors flex items-center gap-2 disabled:opacity-70">
              <Check size={18} />
              {isSaving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

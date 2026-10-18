"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, AlertCircle, Plus, Pencil, Trash2, Bot, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { SecondaryButton, fieldClass } from '@/components/ui/Button';

interface Entry {
  id: string;
  who: string;
  via: string;
  action: 'create' | 'update' | 'delete';
  area: string;
  label: string | null;
  projectName: string | null;
  summary: string;
  changes: Record<string, unknown> | null;
  fields: string[] | null;
  createdAt: number;
  undoneAt: number | null;
}

const AREA_LABELS: Record<string, string> = {
  projects: 'Projects', phases: 'Phases', allocations: 'Team hours', projectCosts: 'Direct costs', payments: 'Payments',
  teamMembers: 'Team', categories: 'Team categories', overheadsProfile: 'Overheads', forecastProfile: 'Forecast',
  projectTasks: 'Planning', documentBlocks: 'Documents', saved_blocks: 'Documents', companies: 'Company settings',
  invites: 'Users', users: 'Users', sampleData: 'Sample data', mcpTokens: 'AI access',
};
const areaOf = (a: string) => AREA_LABELS[a] || 'Other';

const dayLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};
const time = (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const show = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

const ActionIcon = ({ e }: { e: Entry }) => {
  const cls = 'h-7 w-7 rounded-lg flex items-center justify-center shrink-0';
  if (e.via.startsWith('AI')) return <div className={`${cls} bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300`}><Bot size={14} /></div>;
  if (e.action === 'create') return <div className={`${cls} bg-positive-50 dark:bg-positive-950/40 text-positive-700 dark:text-positive-300`}><Plus size={14} /></div>;
  if (e.action === 'delete') return <div className={`${cls} bg-negative-50 dark:bg-negative-950/40 text-negative-700 dark:text-negative-300`}><Trash2 size={14} /></div>;
  return <div className={`${cls} bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300`}><Pencil size={13} /></div>;
};

export function ActivityTab() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [person, setPerson] = useState('');
  const [area, setArea] = useState('');
  const [text, setText] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(async (before?: number) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/activity${before ? `?before=${before}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || 'Could not load the activity log.');
    return d as { entries: Entry[]; nextBefore: number | null };
  }, []);

  useEffect(() => {
    load().then(d => { setEntries(d.entries); setNextBefore(d.nextBefore); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [load]);

  const more = async () => {
    if (!nextBefore) return;
    setLoadingMore(true);
    try {
      const d = await load(nextBefore);
      setEntries(prev => { const seen = new Set(prev.map(e => e.id)); return [...prev, ...d.entries.filter(e => !seen.has(e.id))]; });
      setNextBefore(d.nextBefore);
    } catch (e) { setError((e as Error).message); }
    setLoadingMore(false);
  };

  const people = useMemo(() => [...new Set(entries.map(e => e.who))].sort(), [entries]);
  const areas = useMemo(() => [...new Set(entries.map(e => areaOf(e.area)))].sort(), [entries]);
  const shown = entries.filter(e =>
    (!person || e.who === person) &&
    (!area || areaOf(e.area) === area) &&
    (!text || `${e.summary} ${e.projectName || ''} ${e.label || ''}`.toLowerCase().includes(text.toLowerCase())));

  const byDay: { day: string; items: Entry[] }[] = [];
  shown.forEach(e => {
    const day = dayLabel(e.createdAt);
    if (byDay[byDay.length - 1]?.day !== day) byDay.push({ day, items: [] });
    byDay[byDay.length - 1].items.push(e);
  });

  const toggle = (id: string) => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
          <History size={20} className="text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Activity</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">
            Who changed what in your company, newest first: projects, phases, hours, costs, payments, team, overheads, the forecast and settings, including changes made by AI assistants.
            Pages that save as you type are combined into one entry every few minutes.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-negative-700 dark:text-negative-300 bg-negative-50 dark:bg-negative-950/40 border border-negative-200 dark:border-negative-900 rounded-xl px-3 py-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500" />
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Search changes or projects" className={`${fieldClass} w-full pl-8`} />
        </div>
        <select value={person} onChange={e => setPerson(e.target.value)} className={`${fieldClass} min-w-[160px]`} aria-label="Person">
          <option value="">Everyone</option>
          {people.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={area} onChange={e => setArea(e.target.value)} className={`${fieldClass} min-w-[160px]`} aria-label="Area">
          <option value="">All areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-ink-500 dark:text-ink-400">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-400">{entries.length ? 'No changes match these filters.' : 'No changes recorded yet. New changes appear here from now on.'}</p>
      ) : (
        <div className="space-y-6">
          {byDay.map(g => (
            <div key={g.day}>
              <h3 className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-2">{g.day}</h3>
              <ul className="divide-y divide-ink-100 dark:divide-ink-800 border border-ink-200 dark:border-ink-800 rounded-xl">
                {g.items.map(e => {
                  const details = e.changes ? Object.entries(e.changes) : null;
                  const expandable = !!(details?.length || e.fields?.length);
                  const isOpen = open.has(e.id);
                  return (
                    <li key={e.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <ActionIcon e={e} />
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm ${e.undoneAt ? 'line-through text-ink-500 dark:text-ink-400' : 'text-ink-900 dark:text-ink-100'}`}>{e.summary}</div>
                          <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                            {time(e.createdAt)} · {e.who}{e.via !== 'App' ? ` · ${e.via}` : ''} · {areaOf(e.area)}{e.undoneAt ? ` · undone ${time(e.undoneAt)}` : ''}
                          </div>
                        </div>
                        {expandable && (
                          <button type="button" onClick={() => toggle(e.id)} className="text-xs text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-100 flex items-center gap-0.5 shrink-0" aria-expanded={isOpen}>
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Details
                          </button>
                        )}
                      </div>
                      {expandable && isOpen && (
                        <div className="mt-2 ml-10 text-xs bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg px-3 py-2 space-y-0.5">
                          {details?.length
                            ? details.map(([k, v]) => <div key={k}><span className="text-ink-500 dark:text-ink-400">{k}:</span> <span className="text-ink-800 dark:text-ink-200 break-all">{show(v)}</span></div>)
                            : <div className="text-ink-600 dark:text-ink-300">Fields changed: {e.fields!.join(', ')}</div>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {nextBefore && (
            <div className="flex justify-center">
              <SecondaryButton type="button" onClick={more} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load older changes'}</SecondaryButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

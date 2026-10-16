"use client";
import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ForecastGroup, ForecastGroupColor } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, IconButton, fieldClass } from '@/components/ui/Button';

// Theme-token colours only (full class strings so Tailwind keeps them)
export const GROUP_COLORS: Record<ForecastGroupColor, { label: string; dot: string; stripe: string }> = {
  accent:   { label: 'Teal',  dot: 'bg-accent-500',   stripe: 'shadow-[inset_4px_0_0_var(--accent-500)]' },
  info:     { label: 'Blue',  dot: 'bg-info-500',     stripe: 'shadow-[inset_4px_0_0_var(--info-500)]' },
  positive: { label: 'Green', dot: 'bg-positive-500', stripe: 'shadow-[inset_4px_0_0_var(--positive-500)]' },
  warning:  { label: 'Amber', dot: 'bg-warning-500',  stripe: 'shadow-[inset_4px_0_0_var(--warning-500)]' },
  clay:     { label: 'Clay',  dot: 'bg-clay-500',     stripe: 'shadow-[inset_4px_0_0_var(--clay-500)]' },
  negative: { label: 'Red',   dot: 'bg-negative-500', stripe: 'shadow-[inset_4px_0_0_var(--negative-500)]' },
  ink:      { label: 'Grey',  dot: 'bg-ink-400',      stripe: 'shadow-[inset_4px_0_0_var(--ink-400)]' },
};
const COLOR_KEYS = Object.keys(GROUP_COLORS) as ForecastGroupColor[];

export const newGroupId = () => `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

/** First colour not used yet, so new groups are easy to tell apart. */
export const nextGroupColor = (groups: ForecastGroup[]): ForecastGroupColor =>
  COLOR_KEYS.find(c => !groups.some(g => g.color === c)) || COLOR_KEYS[groups.length % COLOR_KEYS.length];

function ColorSwatches({ value, onChange }: { value: ForecastGroupColor; onChange: (c: ForecastGroupColor) => void }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Group colour">
      {COLOR_KEYS.map(c => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          title={GROUP_COLORS[c].label}
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full ${GROUP_COLORS[c].dot} transition-transform ${
            value === c ? 'ring-2 ring-offset-2 ring-ink-700 dark:ring-ink-200 ring-offset-white dark:ring-offset-ink-900 scale-110' : 'hover:scale-110'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Group field for the add / edit dialogs: pick an existing group or create one inline.
 * Creating returns the new group through onCreate; the caller adds it to the forecast.
 */
export function GroupPicker({
  groups, value, onChange, onCreate,
}: {
  groups: ForecastGroup[];
  value: string | undefined;
  onChange: (groupId: string | undefined) => void;
  onCreate: (group: ForecastGroup) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<ForecastGroupColor>(nextGroupColor(groups));

  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    const group = { id: newGroupId(), name: clean, color };
    onCreate(group);
    onChange(group.id);
    setCreating(false);
    setName('');
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Group</label>
      {!creating ? (
        <div className="flex items-center gap-2">
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value || undefined)}
            className={`${fieldClass} flex-1`}
          >
            <option value="">No group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <SecondaryButton type="button" onClick={() => { setColor(nextGroupColor(groups)); setCreating(true); }}>
            <Plus size={13} />
            <span>New group</span>
          </SecondaryButton>
        </div>
      ) : (
        <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-3 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); create(); }
              if (e.key === 'Escape') { e.preventDefault(); setCreating(false); }
            }}
            placeholder="e.g. India"
            className={`${fieldClass} w-full`}
            aria-label="New group name"
          />
          <ColorSwatches value={color} onChange={setColor} />
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setCreating(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="button" onClick={create} disabled={!name.trim()}>Create group</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

/** Rename, recolour, add and delete groups. Deleting a group leaves its lines ungrouped. */
export function ManageGroupsModal({
  isOpen, groups, usage, onChange, onClose,
}: {
  isOpen: boolean;
  groups: ForecastGroup[];
  usage: Record<string, number>; // groupId -> number of lines in it
  onChange: (groups: ForecastGroup[]) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  if (!isOpen) return null;

  const update = (id: string, patch: Partial<ForecastGroup>) =>
    onChange(groups.map(g => (g.id === id ? { ...g, ...patch } : g)));
  const add = () => {
    const clean = newName.trim();
    if (!clean) return;
    onChange([...groups, { id: newGroupId(), name: clean, color: nextGroupColor(groups) }]);
    setNewName('');
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Groups</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Group inflow and outflow lines, e.g. by country or office. Shared with your team.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {groups.length === 0 && (
            <p className="text-sm text-ink-500 dark:text-ink-400">No groups yet. Add one below, or create one from a row&apos;s edit dialog.</p>
          )}
          {groups.map((g, i) => (
            <div key={g.id} className="rounded-lg border border-ink-200 dark:border-ink-800 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={g.name}
                  onChange={e => update(g.id, { name: e.target.value })}
                  onBlur={e => { if (!e.target.value.trim()) update(g.id, { name: 'Untitled group' }); }}
                  className={`${fieldClass} flex-1 font-semibold`}
                  aria-label="Group name"
                />
                <span className="text-[11px] text-ink-500 dark:text-ink-400 shrink-0 w-14 text-right">{usage[g.id] || 0} line{(usage[g.id] || 0) === 1 ? '' : 's'}</span>
                <IconButton type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" className="w-7 h-7"><ArrowUp size={13} /></IconButton>
                <IconButton type="button" onClick={() => move(i, 1)} disabled={i === groups.length - 1} title="Move down" className="w-7 h-7"><ArrowDown size={13} /></IconButton>
                <IconButton
                  type="button"
                  onClick={() => onChange(groups.filter(x => x.id !== g.id))}
                  title="Delete group (its lines become ungrouped)"
                  className="w-7 h-7 hover:text-negative-600"
                >
                  <Trash2 size={13} />
                </IconButton>
              </div>
              <ColorSwatches value={g.color} onChange={c => update(g.id, { color: c })} />
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              placeholder="New group name, e.g. Spain"
              className={`${fieldClass} flex-1`}
            />
            <SecondaryButton type="button" onClick={add} disabled={!newName.trim()}>
              <Plus size={13} />
              <span>Add</span>
            </SecondaryButton>
          </div>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-ink-100 dark:border-ink-800">
          <PrimaryButton type="button" onClick={onClose}>Done</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { SalaryDebt } from '@/lib/firebase/schema';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

const newId = () => `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
const num = (v: string) => Math.round((parseFloat(v.replace(/[^0-9.]/g, '')) || 0) * 100) / 100;

function Shell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink-100 dark:border-ink-800 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500 dark:text-ink-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Who can be owed salary, and how much was owed before the forecast's first month. */
export function SalaryPartnersModal({ isOpen, value, suggestions, onSave, onClose }: {
  isOpen: boolean;
  value: SalaryDebt | undefined;
  suggestions: string[];
  onSave: (next: SalaryDebt) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<{ id: string; name: string; opening: string; note: string }[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    const ps = value?.partners || [];
    setRows(ps.length ? ps.map(p => ({ id: p.id, name: p.name, opening: p.opening ? String(p.opening) : '', note: p.note || '' })) : [{ id: newId(), name: '', opening: '', note: '' }]);
  }, [isOpen, value]);
  if (!isOpen) return null;

  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(r => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const partners = rows.filter(r => r.name.trim()).map(r => ({ id: r.id, name: r.name.trim(), opening: num(r.opening), ...(r.note.trim() ? { note: r.note.trim() } : {}) }));
    const keep = new Set(partners.map(p => p.id));
    // Drop unpaid amounts of removed partners
    const deferrals = Object.fromEntries(Object.entries(value?.deferrals || {})
      .map(([m, by]) => [m, Object.fromEntries(Object.entries(by).filter(([pid]) => keep.has(pid)))])
      .filter(([, by]) => Object.keys(by as object).length));
    onSave({ partners, deferrals });
    onClose();
  };

  return (
    <Shell title="Partner salaries owed" subtitle="Salary owed before the first month of the forecast" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col min-h-0">
        <div className="p-5 space-y-3 overflow-y-auto">
          <datalist id="salary-partner-names">{suggestions.map(n => <option key={n} value={n} />)}</datalist>
          {rows.map((r, i) => (
            <div key={r.id} className="grid grid-cols-[1fr_7rem_auto] gap-2 items-start">
              <input list="salary-partner-names" value={r.name} onChange={e => set(i, { name: e.target.value })} placeholder="Partner name" className={`${fieldClass} w-full`} />
              <input inputMode="decimal" value={r.opening} onChange={e => set(i, { opening: e.target.value })} placeholder="Owed" className={`${fieldClass} w-full text-right tabular-nums`} title="Salary owed before the forecast starts" />
              <button type="button" onClick={() => setRows(x => x.filter((_, j) => j !== i))} className="p-2 text-negative-400 hover:text-negative-600 hover:bg-negative-50 dark:hover:bg-negative-900/30 rounded-lg" title="Remove"><Trash2 size={14} /></button>
              <input value={r.note} onChange={e => set(i, { note: e.target.value })} placeholder="Note, e.g. unpaid Jun–Sep 2025" className={`${fieldClass} w-full col-span-2 text-xs`} />
            </div>
          ))}
          <button type="button" onClick={() => setRows(r => [...r, { id: newId(), name: '', opening: '', note: '' }])} className="flex items-center gap-1.5 text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"><Plus size={14} /> Add partner</button>
          <p className="text-xs text-ink-500 dark:text-ink-400">Unpaid salary is entered per month in the burn line. Pay it back with expenses in a line marked as a salary repayment.</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-100 dark:border-ink-800 shrink-0">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Save</PrimaryButton>
        </div>
      </form>
    </Shell>
  );
}

/** Salary each partner leaves unpaid in one month. */
export function UnpaidSalaryModal({ isOpen, month, monthLabel, value, onSave, onManagePartners, onClose }: {
  isOpen: boolean;
  month: string;
  monthLabel: string;
  value: SalaryDebt | undefined;
  onSave: (next: SalaryDebt) => void;
  onManagePartners: () => void;
  onClose: () => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!isOpen) return;
    const by = value?.deferrals?.[month] || {};
    setAmounts(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v ? String(v) : ''])));
  }, [isOpen, value, month]);
  if (!isOpen) return null;
  const partners = value?.partners || [];
  const total = partners.reduce((s, p) => s + num(amounts[p.id] || ''), 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const by = Object.fromEntries(partners.map(p => [p.id, num(amounts[p.id] || '')]).filter(([, v]) => (v as number) > 0));
    const deferrals = { ...(value?.deferrals || {}) };
    if (Object.keys(by).length) deferrals[month] = by; else delete deferrals[month];
    onSave({ partners, deferrals });
    onClose();
  };

  return (
    <Shell title="Unpaid salaries" subtitle={`${monthLabel} · lowers this month's burn and adds to what is owed`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col min-h-0">
        <div className="p-5 space-y-2 overflow-y-auto">
          {partners.length === 0 ? (
            <div className="text-sm text-ink-500 dark:text-ink-400">
              No partners set up yet. <button type="button" onClick={onManagePartners} className="font-semibold text-accent-600 dark:text-accent-400 hover:underline">Add partners</button>
            </div>
          ) : partners.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-ink-800 dark:text-ink-200 truncate">{p.name}</span>
              <input inputMode="decimal" value={amounts[p.id] || ''} onChange={e => setAmounts(a => ({ ...a, [p.id]: e.target.value }))} placeholder="0" className={`${fieldClass} w-32 text-right tabular-nums`} aria-label={`${p.name}: unpaid salary`} />
            </div>
          ))}
          {partners.length > 0 && (
            <div className="flex justify-between pt-2 mt-2 border-t border-ink-100 dark:border-ink-800 text-sm font-semibold text-ink-800 dark:text-ink-200">
              <span>Total unpaid</span><span className="tabular-nums">{total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center gap-2 px-5 py-4 border-t border-ink-100 dark:border-ink-800 shrink-0">
          <button type="button" onClick={onManagePartners} className="text-xs font-medium text-accent-600 dark:text-accent-400 hover:underline">Partners and opening amounts</button>
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={partners.length === 0}>Save</PrimaryButton>
          </div>
        </div>
      </form>
    </Shell>
  );
}

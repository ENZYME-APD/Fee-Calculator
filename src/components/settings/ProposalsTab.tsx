"use client";
import React, { useState } from 'react';
import { Company, ProposalDefaults } from '@/lib/firebase/schema';
import { updateCompany } from '@/lib/firebase/db';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';

const input = 'w-full px-3 py-2 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl text-sm text-ink-900 dark:text-ink-50 outline-none focus:ring-2 focus:ring-accent-500/20';
const label = 'block text-xs font-medium text-ink-500 dark:text-ink-400 mb-1';

/** Company-wide proposal defaults: who signs, references, validity, bank details and charge-out rates. */
export function ProposalsTab({ company }: { company: Company }) {
  const [d, setD] = useState<ProposalDefaults>(company.proposal || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const currency = company.currency || 'USD';
  const bank = d.bank || {};
  const rates = d.rates || [];

  const set = <K extends keyof ProposalDefaults>(k: K, v: ProposalDefaults[K]) => setD(p => ({ ...p, [k]: v }));
  const setBank = (k: keyof NonNullable<ProposalDefaults['bank']>, v: string) => setD(p => ({ ...p, bank: { ...(p.bank || {}), [k]: v } }));
  const setRate = (i: number, patch: Partial<{ position: string; rate: number }>) =>
    set('rates', rates.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    if (!company.id) return;
    setSaving(true);
    setMessage('');
    try {
      const cleaned = JSON.parse(JSON.stringify({
        ...d,
        rates: rates.filter(r => r.position.trim()).map(r => ({ position: r.position.trim(), rate: Number(r.rate) || 0 })),
      })) as ProposalDefaults;
      await updateCompany(company.id, { proposal: cleaned });
      setMessage('Saved. Refreshing…');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
      setMessage('Could not save. Only admins can change these.');
    }
    setSaving(false);
  };

  const field = (key: 'legalName' | 'refPrefix' | 'signatoryName' | 'signatoryTitle' | 'signatoryEmail' | 'signatoryPhone', title: string, placeholder = '') => (
    <div>
      <label className={label}>{title}</label>
      <input value={(d[key] as string) || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} className={input} />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50">Proposals</h2>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Defaults that fill fields such as {'{{signatory_name}}'}, {'{{bank_details}}'} and {'{{validity_days}}'} in every proposal. Client, reference and dates are set per project.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200">Company and references</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {field('legalName', 'Legal name', company.name)}
          {field('refPrefix', 'Reference prefix', 'QU')}
          <div>
            <label className={label}>Validity (days)</label>
            <input type="number" value={d.validityDays ?? ''} onChange={e => set('validityDays', e.target.value ? Number(e.target.value) : undefined)} placeholder="60" className={input} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200">Default signatory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('signatoryName', 'Name')}
          {field('signatoryTitle', 'Title', 'e.g. Managing Director')}
          {field('signatoryEmail', 'Email')}
          {field('signatoryPhone', 'Phone')}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200">Bank details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([['accountName', 'Account name'], ['accountNo', 'Account number'], ['bankName', 'Bank name'], ['bankCode', 'Bank code'], ['branch', 'Branch'], ['swift', 'SWIFT code']] as const).map(([k, t]) => (
            <div key={k}>
              <label className={label}>{t}</label>
              <input value={bank[k] || ''} onChange={e => setBank(k, e.target.value)} className={input} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200">Charge-out rates</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">What you bill per hour ({currency}) for extra services and variations. Separate from the internal cost per hour in Team resources.</p>
        </div>
        <div className="space-y-2">
          {rates.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={r.position} onChange={e => setRate(i, { position: e.target.value })} placeholder="Position, e.g. Partner" className={`${input} flex-1`} />
              <input type="number" value={Number.isFinite(r.rate) ? r.rate : ''} onChange={e => setRate(i, { rate: Number(e.target.value) })} placeholder="Rate" className={`${input} w-32 text-right`} />
              <span className="text-xs text-ink-500 dark:text-ink-400 w-14">{currency}/h</span>
              <button type="button" onClick={() => set('rates', rates.filter((_, j) => j !== i))} title="Remove" className="p-2 text-negative-400 hover:text-negative-600 hover:bg-negative-50 dark:hover:bg-negative-900/30 rounded-lg"><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set('rates', [...rates, { position: '', rate: 0 }])} className="flex items-center gap-1.5 text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline">
            <Plus size={14} /> Add rate
          </button>
        </div>
      </section>

      <div className="flex items-center gap-4 pt-2 border-t border-ink-100 dark:border-ink-800">
        <button onClick={save} disabled={saving} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
        {message && <span className="mt-4 text-sm text-ink-500 dark:text-ink-400">{message}</span>}
      </div>
    </div>
  );
}

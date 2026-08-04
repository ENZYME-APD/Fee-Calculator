"use client";
import React, { useState } from 'react';
import { Company } from '@/lib/firebase/schema';
import { updateCompany } from '@/lib/firebase/db';
import { Save, Loader2 } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CNY', name: 'Chinese Yuan (¥)' },
  { code: 'VND', name: 'Vietnamese Dong (₫)' },
  { code: 'PHP', name: 'Philippine Peso (₱)' },
  { code: 'PLN', name: 'Polish Złoty (zł)' },
  { code: 'AED', name: 'UAE Dirham (د.إ)' },
  { code: 'SAR', name: 'Saudi Riyal (﷼)' },
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
];

const AREA_UNITS = [
  { code: 'sqm', name: 'Square Meters (sqm)' },
  { code: 'sqft', name: 'Square Feet (sqft)' },
];

export function PreferencesTab({ company }: { company: Company }) {
  const [currency, setCurrency] = useState(company.currency || 'USD');
  const [areaUnit, setAreaUnit] = useState(company.areaUnit || 'sqm');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!company.id) return;
    setSaving(true);
    setMessage('');
    try {
      await updateCompany(company.id, { currency, areaUnit });
      setMessage('Preferences saved successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 1000); // Reload to apply context globally easily
    } catch (error) {
      console.error(error);
      setMessage('Failed to save preferences.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Preferences</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure default units and formatting used across your company.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Default Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">This currency will be used for all financial summaries and fee proposals.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Area Unit
          </label>
          <select
            value={areaUnit}
            onChange={(e) => setAreaUnit(e.target.value as 'sqm' | 'sqft')}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            {AREA_UNITS.map(u => (
              <option key={u.code} value={u.code}>{u.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">Used when defining project sizes and calculating rates per unit.</p>
        </div>
      </div>

      <div className="pt-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Preferences
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {message}
          </span>
        )}
      </div>

      <div className="pt-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sample Data</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">If your workspace was populated with sample projects and team members, you can safely remove them here.</p>
        </div>
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to delete all sample data? This cannot be undone.')) {
              setSaving(true);
              try {
                const { clearSampleData } = await import('@/lib/firebase/db');
                if (company.id) {
                  await clearSampleData(company.id);
                  setMessage('Sample data cleared successfully.');
                  setTimeout(() => window.location.reload(), 1000);
                }
              } catch (e) {
                setMessage('Error clearing sample data.');
              }
              setSaving(false);
            }
          }}
          className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-bold rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors text-sm border border-rose-200 dark:border-rose-800/50"
        >
          Clear Sample Data
        </button>
      </div>
    </div>
  );
}

"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Project } from '@/lib/firebase/schema';

// Contract currency of a project. Accounting stays in the company currency; a project contracted in
// another currency (e.g. EUR) has a rate (company currency per 1 unit of it), and its fee proposal,
// payment schedule and documents can be shown in either. Amounts the contract fixes (fixed fee, fixed
// payments) are also kept in the contract currency, so changing the rate keeps the contract value.

export interface CurrencyView {
  baseCode: string;
  contractCode: string;
  rate: number; // company currency per 1 contract unit
  showingContract: boolean;
}

const Ctx = createContext<CurrencyView | null>(null);

export const hasContractCurrency = (p?: Project | null) => !!p?.contractCurrency && (p.contractRate || 0) > 0;

export function CurrencyViewProvider({ value, children }: { value: CurrencyView | null; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCurrencyView = () => useContext(Ctx);

/** The view for one project: which currency it is shown in (remembered per project in this browser). */
export function useProjectCurrencyView(project: Project | null | undefined, baseCode: string) {
  const id = project?.id;
  const on = hasContractCurrency(project) && project!.contractCurrency !== baseCode;
  const [showingContract, setShowingContract] = useState(false);
  useEffect(() => {
    if (!id || !on) { setShowingContract(false); return; }
    try { setShowingContract(localStorage.getItem(`currencyView.${id}`) === 'contract'); } catch { setShowingContract(false); }
  }, [id, on]);
  const set = (v: boolean) => {
    setShowingContract(v);
    try { if (id) localStorage.setItem(`currencyView.${id}`, v ? 'contract' : 'base'); } catch {}
  };
  const view: CurrencyView | null = on ? { baseCode, contractCode: project!.contractCurrency!, rate: project!.contractRate!, showingContract } : null;
  return { view, setShowingContract: set };
}

/** Conversions for inputs: what is shown ↔ what is stored (company currency). */
export function viewMath(view: CurrencyView | null) {
  const r = view?.showingContract ? view.rate : 1;
  return {
    toView: (base: number) => base / r,
    fromView: (shown: number) => shown * r,
    // The contract-currency value of an amount typed in the current view (to keep with it)
    contractOf: (shown: number) => (view ? (view.showingContract ? shown : shown / view.rate) : undefined),
  };
}

/** Company / contract currency switch. */
export function CurrencySwitch({ view, onChange, className = '' }: { view: CurrencyView | null; onChange: (contract: boolean) => void; className?: string }) {
  if (!view) return null;
  const btn = (active: boolean) => `px-2.5 py-1 text-xs font-semibold transition-colors ${active ? 'bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800/60'}`;
  return (
    <div className={`flex shrink-0 rounded-lg border border-ink-200 dark:border-ink-700 overflow-hidden ${className}`} role="group" aria-label="Currency shown"
      title={`1 ${view.contractCode} = ${view.rate} ${view.baseCode}. Accounting and the forecast stay in ${view.baseCode}.`}>
      <button type="button" onClick={() => onChange(false)} className={btn(!view.showingContract)} aria-pressed={!view.showingContract}>{view.baseCode}</button>
      <button type="button" onClick={() => onChange(true)} className={`${btn(view.showingContract)} border-l border-ink-200 dark:border-ink-700`} aria-pressed={view.showingContract}>{view.contractCode}</button>
    </div>
  );
}

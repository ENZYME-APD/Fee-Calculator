"use client";
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface ProjectFinancialHeaderProps {
  // Left side is owned by the calling page (project name, status, icons) so
  // each page keeps its own identity controls; this component is the single
  // shared source for the Total Cost / Profit Margin / Total Fee block so
  // those three numbers render identically — same layout, same formula —
  // everywhere a project is open (Projects & Phases, Fee Proposal Canvas).
  left: React.ReactNode;
  totalCost: number;
  profitMarginPercent: number;
  totalFee: number;
  formatCurrency: (n: number) => string;
  marginEditable?: boolean;
  onMarginChange?: (val: number) => void;
  showRefreshRates?: boolean;
  isRefreshingRates?: boolean;
  onRefreshRates?: () => void;
}

export function ProjectFinancialHeader({
  left,
  totalCost,
  profitMarginPercent,
  totalFee,
  formatCurrency,
  marginEditable,
  onMarginChange,
  showRefreshRates,
  isRefreshingRates,
  onRefreshRates,
}: ProjectFinancialHeaderProps) {
  const [isEditingMargin, setIsEditingMargin] = useState(false);
  const [marginInput, setMarginInput] = useState(profitMarginPercent.toString());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap transition-colors">
      <div className="min-w-0">{left}</div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cost</span>
            {showRefreshRates && (
              <Tooltip
                position="bottom"
                content="Re-pull current team rates into this project's allocations. Proposal costs are locked to the rates at the time each allocation was made, so salary changes don't retroactively change an already-agreed fee."
              >
                <button
                  onClick={onRefreshRates}
                  disabled={isRefreshingRates}
                  aria-label="Refresh Rates"
                  className="text-slate-400 hover:text-blue-500 disabled:opacity-50 p-0.5 rounded transition-colors"
                >
                  <RefreshCw size={11} className={isRefreshingRates ? 'animate-spin' : ''} />
                </button>
              </Tooltip>
            )}
          </div>
          <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(totalCost)}</span>
        </div>

        <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Profit Margin</span>
          {marginEditable && isEditingMargin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = parseFloat(marginInput);
                if (!isNaN(val)) onMarginChange?.(val);
                setIsEditingMargin(false);
              }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                step="0.1"
                value={marginInput}
                onChange={(e) => setMarginInput(e.target.value)}
                className="w-14 px-1.5 py-0.5 text-sm border border-slate-300 dark:border-slate-600 rounded text-right font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                autoFocus
                onBlur={() => setIsEditingMargin(false)}
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">%</span>
            </form>
          ) : (
            <div
              className={marginEditable ? 'flex items-center gap-1 cursor-pointer hover:opacity-70' : ''}
              onClick={
                marginEditable
                  ? () => {
                      setMarginInput(profitMarginPercent.toString());
                      setIsEditingMargin(true);
                    }
                  : undefined
              }
            >
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{profitMarginPercent}%</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5">Total Fee</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFee)}</span>
        </div>
      </div>
    </div>
  );
}

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
  // Save once per edit, whether it ends with Enter or by clicking away
  const commitMargin = () => {
    if (!isEditingMargin) return;
    const val = parseFloat(marginInput);
    if (!isNaN(val) && val !== profitMarginPercent) onMarginChange?.(val);
    setIsEditingMargin(false);
  };

  return (
    <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap transition-colors">
      <div className="min-w-0">{left}</div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-end border-r border-ink-200 dark:border-ink-700 pr-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink-500">Total cost</span>
            {showRefreshRates && (
              <Tooltip
                position="bottom"
                content="Re-pull current team rates into this project's allocations. Proposal costs are locked to the rates at the time each allocation was made, so salary changes don't retroactively change an already-agreed fee."
              >
                <button
                  onClick={onRefreshRates}
                  disabled={isRefreshingRates}
                  aria-label="Refresh Rates"
                  className="text-ink-500 hover:text-accent-500 disabled:opacity-50 p-0.5 rounded transition-colors"
                >
                  <RefreshCw size={11} className={isRefreshingRates ? 'animate-spin' : ''} />
                </button>
              </Tooltip>
            )}
          </div>
          <span className="text-lg font-bold text-ink-700 dark:text-ink-300">{formatCurrency(totalCost)}</span>
        </div>

        <div className="flex flex-col items-end border-r border-ink-200 dark:border-ink-700 pr-6">
          <span className="text-xs font-medium text-ink-500 mb-0.5">Profit margin</span>
          {marginEditable && isEditingMargin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitMargin();
              }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                step="0.1"
                value={marginInput}
                onChange={(e) => setMarginInput(e.target.value)}
                className="w-14 px-1.5 py-0.5 text-sm border border-ink-300 dark:border-ink-600 rounded text-right font-bold text-ink-800 dark:text-ink-200 bg-ink-50 dark:bg-ink-800 focus:outline-none focus:border-accent-500"
                autoFocus
                onBlur={commitMargin} // clicking away saves too, not only Enter
                onKeyDown={(e) => { if (e.key === 'Escape') { setMarginInput(profitMarginPercent.toString()); setIsEditingMargin(false); } }}
              />
              <span className="text-sm font-bold text-ink-600 dark:text-ink-400">%</span>
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
              <span className="text-lg font-bold text-ink-700 dark:text-ink-300">{profitMarginPercent}%</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-positive-600/70 dark:text-positive-400/70 mb-0.5">Total fee</span>
          <span className="text-xl font-black text-positive-600 dark:text-positive-400">{formatCurrency(totalFee)}</span>
        </div>
      </div>
    </div>
  );
}

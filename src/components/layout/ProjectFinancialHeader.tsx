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
  // Fixed fee: the total fee is typed and the margin is calculated from it
  isFixedFee?: boolean;
  onFixedFeeChange?: (fee: number | null) => void; // null switches fixed fee off
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
  isFixedFee,
  onFixedFeeChange,
}: ProjectFinancialHeaderProps) {
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState('');
  const startFeeEdit = () => { setFeeInput(String(Math.round(totalFee))); setIsEditingFee(true); };
  const commitFee = () => {
    if (!isEditingFee) return;
    const val = parseInt(feeInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val > 0 && val !== Math.round(totalFee)) onFixedFeeChange?.(val);
    setIsEditingFee(false);
  };
  const marginIsEditable = marginEditable && !isFixedFee;
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
          {marginIsEditable && isEditingMargin ? (
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
              className={marginIsEditable ? 'flex items-center gap-1 cursor-pointer hover:opacity-70' : ''}
              title={isFixedFee ? 'Calculated from the fixed fee: (fee − cost) ÷ cost' : undefined}
              onClick={
                marginIsEditable
                  ? () => {
                      setMarginInput(profitMarginPercent.toString());
                      setIsEditingMargin(true);
                    }
                  : undefined
              }
            >
              <span className={`text-lg font-bold ${isFixedFee && profitMarginPercent < 0 ? 'text-negative-600 dark:text-negative-400' : 'text-ink-700 dark:text-ink-300'}`}>{profitMarginPercent}%</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-positive-600/70 dark:text-positive-400/70">Total fee</span>
            {onFixedFeeChange && (
              <button
                type="button"
                role="switch"
                aria-checked={!!isFixedFee}
                onClick={() => (isFixedFee ? onFixedFeeChange(null) : onFixedFeeChange(Math.round(totalFee)))}
                className={`flex items-center gap-1 text-[10px] font-semibold rounded-full pl-0.5 pr-1.5 py-0.5 transition-colors ${
                  isFixedFee ? 'bg-positive-100 text-positive-800 dark:bg-positive-900/50 dark:text-positive-200' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
                }`}
                title={isFixedFee ? 'Fixed fee is on: the margin is calculated from the fee. Click to go back to cost + margin.' : 'Fix the total fee to an agreed amount; the margin is then calculated from it.'}
              >
                <span className={`w-3 h-3 rounded-full transition-colors ${isFixedFee ? 'bg-positive-600' : 'bg-ink-300 dark:bg-ink-600'}`} />
                Fixed
              </button>
            )}
          </div>
          {isFixedFee && onFixedFeeChange && isEditingFee ? (
            <form onSubmit={(e) => { e.preventDefault(); commitFee(); }}>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={feeInput ? (parseInt(feeInput.replace(/[^0-9]/g, ''), 10) || 0).toLocaleString('en-US') : ''}
                onChange={(e) => setFeeInput(e.target.value)}
                onBlur={commitFee}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingFee(false); }}
                className="w-32 px-1.5 py-0.5 text-lg border border-positive-300 dark:border-positive-700 rounded text-right font-black text-positive-700 dark:text-positive-300 bg-positive-50 dark:bg-positive-950/40 focus:outline-none focus:border-positive-500 tabular-nums"
                aria-label="Fixed total fee"
              />
            </form>
          ) : (
            <span
              onClick={isFixedFee && onFixedFeeChange ? startFeeEdit : undefined}
              className={`text-xl font-black text-positive-600 dark:text-positive-400 ${isFixedFee && onFixedFeeChange ? 'cursor-pointer hover:opacity-70 underline decoration-dotted underline-offset-4 decoration-positive-400/60' : ''}`}
              title={isFixedFee && onFixedFeeChange ? 'Click to change the fixed fee' : undefined}
            >
              {formatCurrency(totalFee)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

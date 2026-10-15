"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Download, 
  Trash2, 
  TrendingUp, 
  ArrowUpRight, 
  Check, 
  FolderSync,
  DollarSign,
  RotateCcw,
  UserCheck,
  Edit2,
  Undo2
} from 'lucide-react';
import { 
  ForecastProfile, 
  ForecastRow, 
  ForecastPill, 
  ForecastStage, 
  ForecastOutflowItem, 
  Project, 
  Phase, 
  Payment 
} from '@/lib/firebase/schema';
import { 
  getForecastProfile, 
  updateForecastProfile, 
  getProjects, 
  getPhases, 
  getPayments, 
  getOverheadsProfile 
} from '@/lib/firebase/db';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton, IconButton, fieldClass } from '@/components/ui/Button';
import { EditPillModal } from './EditPillModal';
import { AddRowModal } from './AddRowModal';
import { EditRowModal } from './EditRowModal';
import { AddOutflowModal } from './AddOutflowModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { 
  SPREADSHEET_BASELINE_ROWS, 
  SPREADSHEET_BASELINE_OUTFLOWS, 
  SPREADSHEET_BASELINE_SETTINGS 
} from './forecastBaseline';

// Helpers to format YYYY-MM
function addMonths(yearMonth: string, offset: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  const newY = d.getUTCFullYear();
  const newM = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${newY}-${newM}`;
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function FinancialForecastView() {
  const { formatCurrency, currencyCode } = useAppSettings();
  const fmt = (val: number) => formatCurrency(Math.round(val), 0, 0);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ForecastProfile | null>(null);

  // Global settings
  const [startMonthKey, setStartMonthKey] = useState<string>(SPREADSHEET_BASELINE_SETTINGS.startMonthKey);
  const [visibleMonthsCount, setVisibleMonthsCount] = useState<number>(SPREADSHEET_BASELINE_SETTINGS.visibleMonthsCount);
  const [startingBankBalance, setStartingBankBalance] = useState<number>(SPREADSHEET_BASELINE_SETTINGS.startingBankBalance);
  const [possibleConversion, setPossibleConversion] = useState<number>(SPREADSHEET_BASELINE_SETTINGS.possibleConversion);
  const [invoicingConversion, setInvoicingConversion] = useState<number>(SPREADSHEET_BASELINE_SETTINGS.invoicingConversion);

  // Rows and Outflows
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [outflows, setOutflows] = useState<ForecastOutflowItem[]>([]);

  // Modals state
  const [pillModalOpen, setPillModalOpen] = useState(false);
  const [activeCellLocation, setActiveCellLocation] = useState<{ rowId: string; monthKey: string; stage: ForecastStage } | null>(null);
  const [editingPill, setEditingPill] = useState<ForecastPill | null>(null);

  const [addRowModalOpen, setAddRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ForecastRow | null>(null);
  const [resetRowTarget, setResetRowTarget] = useState<ForecastRow | null>(null);
  const [addOutflowModalOpen, setAddOutflowModalOpen] = useState(false);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [confirmResetBaselineOpen, setConfirmResetBaselineOpen] = useState(false);
  const [deleteRowTarget, setDeleteRowTarget] = useState<string | null>(null);

  // Debounced auto-save timer
  const isInitialLoad = useRef(true);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load existing profile or initialize from spreadsheet baseline
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const existingProfile = await getForecastProfile();

        if (existingProfile && existingProfile.rows && existingProfile.rows.length > 0) {
          setProfile(existingProfile);
          setStartMonthKey(existingProfile.startMonthKey || SPREADSHEET_BASELINE_SETTINGS.startMonthKey);
          setVisibleMonthsCount(existingProfile.visibleMonthsCount || SPREADSHEET_BASELINE_SETTINGS.visibleMonthsCount);
          setStartingBankBalance(Math.round(existingProfile.startingBankBalance ?? SPREADSHEET_BASELINE_SETTINGS.startingBankBalance));
          setPossibleConversion(existingProfile.possibleConversionPercent ?? SPREADSHEET_BASELINE_SETTINGS.possibleConversion);
          setInvoicingConversion(existingProfile.invoicingConversionPercent ?? SPREADSHEET_BASELINE_SETTINGS.invoicingConversion);
          setRows(existingProfile.rows || []);
          // Ensure fixed outflows don't have hardcoded simon duplicate if dynamic commission is used
          const cleanOutflows = (existingProfile.outflows || []).filter(o => o.id !== 'partner_simon');
          setOutflows(cleanOutflows.length > 0 ? cleanOutflows : SPREADSHEET_BASELINE_OUTFLOWS);
        } else {
          // Initialize with user's financial spreadsheet baseline
          setStartMonthKey(SPREADSHEET_BASELINE_SETTINGS.startMonthKey);
          setVisibleMonthsCount(SPREADSHEET_BASELINE_SETTINGS.visibleMonthsCount);
          setStartingBankBalance(SPREADSHEET_BASELINE_SETTINGS.startingBankBalance);
          setPossibleConversion(SPREADSHEET_BASELINE_SETTINGS.possibleConversion);
          setInvoicingConversion(SPREADSHEET_BASELINE_SETTINGS.invoicingConversion);
          setRows(SPREADSHEET_BASELINE_ROWS);
          setOutflows(SPREADSHEET_BASELINE_OUTFLOWS);
        }
      } catch (err) {
        console.error("Error loading forecast data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Debounced auto-save whenever rows, outflows, or settings change
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateForecastProfile({
          startMonthKey,
          visibleMonthsCount,
          startingBankBalance: Math.round(startingBankBalance),
          possibleConversionPercent: Math.round(possibleConversion),
          invoicingConversionPercent: Math.round(invoicingConversion),
          rows,
          outflows
        });
      } catch (e) {
        console.error("Failed to auto-save forecast", e);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [startMonthKey, visibleMonthsCount, startingBankBalance, possibleConversion, invoicingConversion, rows, outflows]);

  // Generate list of displayed month keys
  const monthKeys = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < visibleMonthsCount; i++) {
      list.push(addMonths(startMonthKey, i));
    }
    return list;
  }, [startMonthKey, visibleMonthsCount]);

  // Dynamic Referral Commissions Map: { [referralName]: { [monthKey]: calculatedAmount } }
  const dynamicReferrals = useMemo(() => {
    const map: Record<string, { total: number; monthly: Record<string, number> }> = {};

    rows.forEach(row => {
      Object.entries(row.cells).forEach(([mKey, monthCell]) => {
        // Referral commissions apply to collections
        (monthCell.collections || []).forEach(pill => {
          if (pill.referralName && pill.referralName.trim()) {
            const name = pill.referralName.trim();
            const pct = pill.referralPercent || 0;
            const cut = Math.round(pill.amount * (pct / 100));

            if (!map[name]) {
              map[name] = { total: 0, monthly: {} };
            }
            map[name].monthly[mKey] = (map[name].monthly[mKey] || 0) + cut;
            map[name].total += cut;
          }
        });
      });
    });

    return map;
  }, [rows]);

  const referralNames = useMemo(() => Object.keys(dynamicReferrals).sort(), [dynamicReferrals]);

  // Reset entire forecast to original spreadsheet baseline
  const handleResetToBaseline = () => {
    setStartMonthKey(SPREADSHEET_BASELINE_SETTINGS.startMonthKey);
    setVisibleMonthsCount(SPREADSHEET_BASELINE_SETTINGS.visibleMonthsCount);
    setStartingBankBalance(SPREADSHEET_BASELINE_SETTINGS.startingBankBalance);
    setPossibleConversion(SPREADSHEET_BASELINE_SETTINGS.possibleConversion);
    setInvoicingConversion(SPREADSHEET_BASELINE_SETTINGS.invoicingConversion);
    setRows(SPREADSHEET_BASELINE_ROWS);
    setOutflows(SPREADSHEET_BASELINE_OUTFLOWS);
    setConfirmResetBaselineOpen(false);
  };

  // Reset a SINGLE row back to its original baseline state (or re-sync if from fee proposal)
  const handleResetSingleRow = async (targetRow: ForecastRow) => {
    setLoading(true);
    try {
      // 1. Check if it matches a baseline spreadsheet row
      const baselineMatch = SPREADSHEET_BASELINE_ROWS.find(
        b => b.id === targetRow.id || b.name.toLowerCase() === targetRow.name.toLowerCase()
      );

      if (baselineMatch) {
        setRows(prev => prev.map(r => r.id === targetRow.id ? JSON.parse(JSON.stringify(baselineMatch)) : r));
      } else if (targetRow.projectId) {
        // 2. If it is linked to a Fee Proposal project, re-fetch its payment milestones from db
        const payments = await getPayments(targetRow.projectId);
        const projCells: Record<string, Partial<Record<ForecastStage, ForecastPill[]>>> = {};

        payments.forEach((pmt, idx) => {
          const targetMonth = monthKeys[Math.min(idx, monthKeys.length - 1)] || monthKeys[0];
          const amount = Math.round(((pmt.percentage || 10) / 100) * 25000);
          const stage: ForecastStage = 'possible';
          
          if (!projCells[targetMonth]) projCells[targetMonth] = {};
          if (!projCells[targetMonth][stage]) projCells[targetMonth][stage] = [];
          
          projCells[targetMonth][stage]!.push({
            id: `pill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            amount,
            label: pmt.name || 'Milestone'
          });
        });

        setRows(prev => prev.map(r => r.id === targetRow.id ? { ...r, cells: projCells } : r));
      } else {
        // 3. Custom user-created row with no baseline: clear all pills
        setRows(prev => prev.map(r => r.id === targetRow.id ? { ...r, cells: {} } : r));
      }
      setResetRowTarget(null);
    } catch (err) {
      console.error("Failed to reset row", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync projects from Fee Proposals
  const handleSyncFromProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await getProjects();
      const nonTemplates = allProjects.filter(p => !p.isTemplate && p.status !== 'Lost');
      
      const newRows: ForecastRow[] = [...rows];

      for (const proj of nonTemplates) {
        const existing = newRows.find(r => r.projectId === proj.id || r.name.toLowerCase() === proj.name.toLowerCase());
        if (!existing) {
          // Fetch payments
          const payments = await getPayments(proj.id!);
          const projCells: Record<string, Partial<Record<ForecastStage, ForecastPill[]>>> = {};

          // Distribute milestones across visible months
          payments.forEach((pmt, idx) => {
            const targetMonth = monthKeys[Math.min(idx, monthKeys.length - 1)] || monthKeys[0];
            const amount = Math.round(((pmt.percentage || 10) / 100) * 25000);
            const stage: ForecastStage = proj.status === 'Active' ? 'invoicing' : 'possible';
            
            if (!projCells[targetMonth]) projCells[targetMonth] = {};
            if (!projCells[targetMonth][stage]) projCells[targetMonth][stage] = [];
            
            projCells[targetMonth][stage]!.push({
              id: `pill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              amount,
              label: pmt.name || 'Milestone'
            });
          });

          newRows.push({
            id: `row_proj_${proj.id}`,
            name: proj.name,
            type: 'project',
            projectId: proj.id,
            colorTag: 'accent',
            notes: proj.status || undefined,
            cells: projCells
          });
        }
      }

      setRows(newRows);
      setConfirmSyncOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add / Edit pill
  const handleSavePill = (savedPill: ForecastPill, targetStage: ForecastStage) => {
    if (!activeCellLocation) return;
    const { rowId, monthKey, stage: originStage } = activeCellLocation;

    setRows(prevRows => prevRows.map(row => {
      if (row.id !== rowId) return row;

      const cells = { ...row.cells };
      if (!cells[monthKey]) cells[monthKey] = {};

      // If updating existing pill and stage changed, remove from old stage
      if (originStage !== targetStage && cells[monthKey][originStage]) {
        cells[monthKey][originStage] = cells[monthKey][originStage]!.filter(p => p.id !== savedPill.id);
      }

      const targetList = cells[monthKey][targetStage] ? [...cells[monthKey][targetStage]!] : [];
      const existingIdx = targetList.findIndex(p => p.id === savedPill.id);
      if (existingIdx >= 0) {
        targetList[existingIdx] = savedPill;
      } else {
        targetList.push(savedPill);
      }
      cells[monthKey][targetStage] = targetList;

      return { ...row, cells };
    }));
  };

  // Delete pill
  const handleDeletePill = (pillId: string) => {
    if (!activeCellLocation) return;
    const { rowId, monthKey, stage } = activeCellLocation;

    setRows(prevRows => prevRows.map(row => {
      if (row.id !== rowId) return row;
      const cells = { ...row.cells };
      if (cells[monthKey] && cells[monthKey][stage]) {
        cells[monthKey][stage] = cells[monthKey][stage]!.filter(p => p.id !== pillId);
      }
      return { ...row, cells };
    }));
  };

  // Drag & drop move between stages/months
  const handleMovePill = (
    rowId: string, 
    fromMonth: string, 
    fromStage: ForecastStage, 
    toMonth: string, 
    toStage: ForecastStage, 
    pill: ForecastPill
  ) => {
    if (fromMonth === toMonth && fromStage === toStage) return;

    setRows(prevRows => prevRows.map(row => {
      if (row.id !== rowId) return row;
      const cells = { ...row.cells };

      // Remove from origin
      if (cells[fromMonth]?.[fromStage]) {
        cells[fromMonth][fromStage] = cells[fromMonth][fromStage]!.filter(p => p.id !== pill.id);
      }

      // Add to destination
      if (!cells[toMonth]) cells[toMonth] = {};
      const destList = cells[toMonth][toStage] ? [...cells[toMonth][toStage]!] : [];
      destList.push(pill);
      cells[toMonth][toStage] = destList;

      return { ...row, cells };
    }));
  };

  // Outflow amount change
  const handleUpdateOutflowMonth = (outflowId: string, monthKey: string, amount: number) => {
    setOutflows(prev => prev.map(item => {
      if (item.id !== outflowId) return item;
      return {
        ...item,
        monthlyAmounts: {
          ...item.monthlyAmounts,
          [monthKey]: Math.round(amount)
        }
      };
    }));
  };

  // Monthly totals calculation
  const monthlyStats = useMemo(() => {
    const stats: Record<string, {
      possible: number;
      invoicing: number;
      collections: number;
      conservative: number;
      expected: number;
      optimistic: number;
      totalOutflows: number;
      netDelta: number;
      closingCash: number;
    }> = {};

    let runningCash = startingBankBalance;

    for (const m of monthKeys) {
      let mPossible = 0;
      let mInvoicing = 0;
      let mCollections = 0;

      rows.forEach(r => {
        const cell = r.cells[m];
        if (cell) {
          (cell.possible || []).forEach(p => mPossible += p.amount);
          (cell.invoicing || []).forEach(p => mInvoicing += p.amount);
          (cell.collections || []).forEach(p => mCollections += p.amount);
        }
      });

      // Fixed & Debt Outflows for month m
      let mOutflows = 0;
      outflows.forEach(item => {
        mOutflows += (item.monthlyAmounts[m] || 0);
      });

      // Add Dynamic Referral Commission Outflows for month m
      Object.values(dynamicReferrals).forEach(refData => {
        mOutflows += (refData.monthly[m] || 0);
      });

      const conservative = mCollections;
      const expected = Math.round(mCollections + (mInvoicing * (invoicingConversion / 100)) + (mPossible * (possibleConversion / 100)));
      const optimistic = mCollections + mInvoicing + mPossible;

      // Net change based on real collections minus all outflows (burn + debt + referral commissions)
      const netDelta = mCollections - mOutflows;
      runningCash += netDelta;

      stats[m] = {
        possible: mPossible,
        invoicing: mInvoicing,
        collections: mCollections,
        conservative,
        expected,
        optimistic,
        totalOutflows: mOutflows,
        netDelta,
        closingCash: runningCash
      };
    }

    return stats;
  }, [monthKeys, rows, outflows, dynamicReferrals, startingBankBalance, possibleConversion, invoicingConversion]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-ink-500">
        <RefreshCw size={24} className="animate-spin mr-2 text-accent-500" />
        <span className="text-sm font-semibold">Loading financial forecast...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-ink-50/50 dark:bg-black font-sans">
      {/* Top Header & Global Conversion Controls */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 shadow-sm z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-accent-600 dark:text-accent-400" />
            <h1 className="text-lg font-bold text-ink-900 dark:text-ink-100 tracking-tight">
              Financial forecast
            </h1>
          </div>

          {/* Starting bank balance */}
          <div className="flex items-center gap-2 px-3 py-1 bg-ink-50 dark:bg-ink-800 rounded-lg border border-ink-200 dark:border-ink-700">
            <span className="text-xs font-medium text-ink-500">Opening bank cash:</span>
            <div className="flex items-center gap-1 font-bold text-sm text-ink-900 dark:text-ink-100">
              <span className="text-xs text-ink-400">{currencyCode}</span>
              <input
                type="number"
                step="1"
                value={startingBankBalance === 0 ? '' : startingBankBalance}
                onChange={e => {
                  const val = parseInt(e.target.value.replace(/[^0-9-]/g, '')) || 0;
                  setStartingBankBalance(val);
                }}
                className="w-24 bg-transparent outline-none text-right font-bold"
              />
            </div>
          </div>

          {/* Number inputs for conversion rates */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-ink-500 font-medium">Possible weight:</span>
              <div className="flex items-center gap-0.5 bg-ink-50 dark:bg-ink-800 px-2 py-0.5 rounded border border-ink-200 dark:border-ink-700">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={possibleConversion}
                  onChange={e => setPossibleConversion(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-10 bg-transparent text-right font-bold outline-none text-ink-800 dark:text-ink-200"
                />
                <span className="font-bold text-ink-400">%</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-ink-500 font-medium">Invoiced weight:</span>
              <div className="flex items-center gap-0.5 bg-ink-50 dark:bg-ink-800 px-2 py-0.5 rounded border border-ink-200 dark:border-ink-700">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={invoicingConversion}
                  onChange={e => setInvoicingConversion(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-10 bg-transparent text-right font-bold outline-none text-ink-800 dark:text-ink-200"
                />
                <span className="font-bold text-ink-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Controls & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Month window navigation */}
          <div className="flex items-center gap-1 bg-ink-50 dark:bg-ink-800 p-0.5 rounded-lg border border-ink-200 dark:border-ink-700">
            <button
              onClick={() => setStartMonthKey(prev => addMonths(prev, -1))}
              className="p-1 text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 rounded hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-2 text-ink-700 dark:text-ink-300">
              {formatMonthLabel(startMonthKey)} - {formatMonthLabel(monthKeys[monthKeys.length - 1])}
            </span>
            <button
              onClick={() => setStartMonthKey(prev => addMonths(prev, 1))}
              className="p-1 text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 rounded hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Visible months duration selector */}
          <select
            value={visibleMonthsCount}
            onChange={e => setVisibleMonthsCount(parseInt(e.target.value))}
            className="px-2.5 py-1.5 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold rounded-lg outline-none text-ink-700 dark:text-ink-300"
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>

          {/* Reset to Spreadsheet Baseline */}
          <SecondaryButton onClick={() => setConfirmResetBaselineOpen(true)} title="Reset entire matrix to original spreadsheet data">
            <RotateCcw size={14} />
            <span>Reset baseline</span>
          </SecondaryButton>

          {/* Sync from Projects */}
          <SecondaryButton onClick={() => setConfirmSyncOpen(true)}>
            <FolderSync size={14} />
            <span>Sync projects</span>
          </SecondaryButton>

          {/* Add custom workstream */}
          <PrimaryButton onClick={() => setAddRowModalOpen(true)}>
            <Plus size={14} />
            <span>Add row</span>
          </PrimaryButton>

          {isSaving && (
            <span className="text-[11px] text-ink-400 italic">Saving...</span>
          )}
        </div>
      </div>

      {/* Main Forecast Matrix Table */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="min-w-fit shadow-sm">
          {/* Matrix Header */}
          <div className="bg-ink-50 dark:bg-ink-950 border-b border-ink-200 dark:border-ink-800 flex sticky top-0 z-20">
            {/* Workstream Column: 280px */}
            <div className="w-[280px] shrink-0 p-3.5 font-bold text-xs uppercase tracking-wider text-ink-500 border-r border-ink-200 dark:border-ink-800 flex items-center justify-between">
              <span>Workstream</span>
              <span className="text-[10px] text-ink-400 lowercase font-normal">({rows.length} rows)</span>
            </div>

            {/* Description / Notes Column: 200px */}
            <div className="w-[200px] shrink-0 p-3.5 font-bold text-xs uppercase tracking-wider text-ink-500 border-r border-ink-200 dark:border-ink-800 flex items-center">
              <span>Description / notes</span>
            </div>

            {/* Month Column Headers with 3 stage sub-columns: 360px per month */}
            {monthKeys.map(m => (
              <div key={m} className="w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 flex flex-col">
                <div className="text-center py-2 border-b border-ink-200 dark:border-ink-800 font-bold text-xs text-ink-800 dark:text-ink-200 bg-ink-100/50 dark:bg-ink-900/50">
                  {formatMonthLabel(m)}
                </div>
                <div className="grid grid-cols-3 text-[11px] font-semibold text-center py-1 text-ink-500 bg-ink-50/50 dark:bg-ink-950/50">
                  <span className="text-warning-600 dark:text-warning-400 py-0.5">Possible</span>
                  <span className="text-accent-600 dark:text-accent-400 py-0.5 border-x border-ink-200 dark:border-ink-800">Invoiced</span>
                  <span className="text-positive-600 dark:text-positive-400 py-0.5">Collections</span>
                </div>
              </div>
            ))}
          </div>

          {/* Workstream Inflow Rows */}
          <div className="divide-y divide-ink-100 dark:divide-ink-800 bg-white dark:bg-ink-900">
            {rows.map(row => {
              const tagBorder = 
                row.colorTag === 'negative' ? 'border-l-4 border-l-negative-500' :
                row.colorTag === 'warning' ? 'border-l-4 border-l-warning-500' :
                row.colorTag === 'positive' ? 'border-l-4 border-l-positive-500' :
                row.colorTag === 'accent' ? 'border-l-4 border-l-accent-500' :
                'border-l-4 border-l-transparent';

              return (
                <div key={row.id} className={`flex group hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors ${tagBorder}`}>
                  {/* Column 1: Workstream Name & Row Actions (280px) */}
                  <div className="w-[280px] shrink-0 p-3 border-r border-ink-100 dark:border-ink-800 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="overflow-hidden min-w-0">
                      <div className="font-bold text-xs text-ink-800 dark:text-ink-200 truncate" title={row.name}>
                        {row.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold capitalize ${
                          row.type === 'external' ? 'bg-negative-50 text-negative-700 dark:bg-negative-950/40 dark:text-negative-400' :
                          row.type === 'retainer' ? 'bg-positive-50 text-positive-700 dark:bg-positive-950/40 dark:text-positive-400' :
                          'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400'
                        }`}>
                          {row.type}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons on hover: Edit, Reset, Delete */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <IconButton
                        onClick={() => setEditingRow(row)}
                        className="hover:text-accent-600"
                        title="Edit workstream details"
                      >
                        <Edit2 size={13} />
                      </IconButton>
                      <IconButton
                        onClick={() => setResetRowTarget(row)}
                        className="hover:text-warning-600"
                        title="Reset row to baseline or original proposal"
                      >
                        <Undo2 size={13} />
                      </IconButton>
                      <IconButton
                        onClick={() => setDeleteRowTarget(row.id)}
                        className="hover:text-negative-600"
                        title="Delete row"
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    </div>
                  </div>

                  {/* Column 2: Description / Notes (200px) */}
                  <div 
                    onClick={() => setEditingRow(row)}
                    className="w-[200px] shrink-0 p-3 border-r border-ink-100 dark:border-ink-800 flex items-center text-xs text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-ink-100/40 dark:hover:bg-ink-800/40 transition-colors overflow-hidden"
                    title="Click to edit notes"
                  >
                    {row.notes ? (
                      <span className="truncate italic">{row.notes}</span>
                    ) : (
                      <span className="text-ink-300 dark:text-ink-600 italic text-[11px] group-hover:inline hidden">+ Add description</span>
                    )}
                  </div>

                  {/* 3 Stage Cells for Each Month (360px per month) */}
                  {monthKeys.map(m => {
                    const monthCell = row.cells[m] || {};

                    return (
                      <div key={m} className="w-[360px] shrink-0 grid grid-cols-3 border-r border-ink-100 dark:border-ink-800 last:border-r-0 min-h-[56px]">
                        {(['possible', 'invoicing', 'collections'] as ForecastStage[]).map((stage, colIdx) => {
                          const pills = monthCell[stage] || [];
                          const borderClasses = colIdx === 1 ? 'border-x border-ink-100 dark:border-ink-800/60' : '';

                          return (
                            <div 
                              key={stage}
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => {
                                e.preventDefault();
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                  if (data && data.pill) {
                                    handleMovePill(data.fromRowId, data.fromMonth, data.fromStage, m, stage, data.pill);
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className={`p-1.5 flex flex-col gap-1.5 relative group/cell min-h-[56px] hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-colors ${borderClasses}`}
                            >
                              {/* Pill items */}
                              {pills.map(pill => (
                                <div
                                  key={pill.id}
                                  draggable
                                  onDragStart={e => {
                                    e.dataTransfer.setData('text/plain', JSON.stringify({
                                      fromRowId: row.id,
                                      fromMonth: m,
                                      fromStage: stage,
                                      pill
                                    }));
                                  }}
                                  onClick={() => {
                                    setActiveCellLocation({ rowId: row.id, monthKey: m, stage });
                                    setEditingPill(pill);
                                    setPillModalOpen(true);
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-bold cursor-grab active:cursor-grabbing border shadow-2xs transition-all hover:scale-[1.02] flex items-center justify-between gap-1 select-none ${
                                    stage === 'possible' ? 'bg-warning-50 text-warning-800 border-warning-200 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-800/60' :
                                    stage === 'invoicing' ? 'bg-accent-50 text-accent-800 border-accent-200 dark:bg-accent-950/40 dark:text-accent-300 dark:border-accent-800/60' :
                                    'bg-positive-50 text-positive-800 border-positive-200 dark:bg-positive-950/40 dark:text-positive-300 dark:border-positive-800/60'
                                  }`}
                                  title={`${pill.label}${pill.referralName ? ` • Referral: ${pill.referralName} (${pill.referralPercent || 0}%)` : ''}${pill.invoiceNumber ? ` • Inv #${pill.invoiceNumber}` : ''}${pill.notes ? ` • ${pill.notes}` : ''}`}
                                >
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="truncate">{pill.label}</span>
                                    {pill.referralName && (
                                      <span className="shrink-0 text-[9px] px-1 py-0.2 rounded bg-ink-200/80 dark:bg-ink-700 text-ink-700 dark:text-ink-200 font-semibold" title={`Referral: ${pill.referralName} (${pill.referralPercent || 0}%)`}>
                                        {pill.referralName.substring(0, 1).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="shrink-0">{fmt(pill.amount)}</span>
                                </div>
                              ))}

                              {/* Quick + Button */}
                              <button
                                onClick={() => {
                                  setActiveCellLocation({ rowId: row.id, monthKey: m, stage });
                                  setEditingPill(null);
                                  setPillModalOpen(true);
                                }}
                                className="w-full py-1 text-ink-300 dark:text-ink-600 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                                title="Add payment item"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Subtotals by Stage */}
          <div className="bg-ink-50/70 dark:bg-ink-950/80 border-t-2 border-ink-200 dark:border-ink-800 flex font-bold text-xs">
            <div className="w-[480px] shrink-0 p-3 text-ink-700 dark:text-ink-300 uppercase tracking-wider border-r border-ink-200 dark:border-ink-800">
              Total Inflows
            </div>
            {monthKeys.map(m => {
              const st = monthlyStats[m] || { possible: 0, invoicing: 0, collections: 0 };
              return (
                <div key={m} className="w-[360px] shrink-0 grid grid-cols-3 border-r border-ink-200 dark:border-ink-800 last:border-r-0 py-2.5 px-1.5 text-center">
                  <span className="text-warning-700 dark:text-warning-300">{fmt(st.possible)}</span>
                  <span className="text-accent-700 dark:text-accent-300 border-x border-ink-200 dark:border-ink-800">{fmt(st.invoicing)}</span>
                  <span className="text-positive-700 dark:text-positive-300">{fmt(st.collections)}</span>
                </div>
              );
            })}
          </div>

          {/* Scenarios Breakdown (Conservative / Expected / Optimistic) */}
          <div className="bg-ink-100/40 dark:bg-ink-950/40 border-t border-ink-200 dark:border-ink-800 divide-y divide-ink-100 dark:divide-ink-800 text-xs">
            {/* Conservative */}
            <div className="flex items-center text-ink-600 dark:text-ink-400">
              <div className="w-[480px] shrink-0 px-3.5 py-1.5 font-medium border-r border-ink-200 dark:border-ink-800">
                • Conservative (100% Collections)
              </div>
              {monthKeys.map(m => (
                <div key={m} className="w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 px-3 py-1.5 text-right font-bold text-ink-700 dark:text-ink-300">
                  {fmt(monthlyStats[m]?.conservative || 0)}
                </div>
              ))}
            </div>

            {/* Expected */}
            <div className="flex items-center text-accent-700 dark:text-accent-300 bg-accent-50/30 dark:bg-accent-950/20 font-semibold">
              <div className="w-[480px] shrink-0 px-3.5 py-1.5 border-r border-ink-200 dark:border-ink-800">
                • Expected ({invoicingConversion}% Inv + {possibleConversion}% Poss)
              </div>
              {monthKeys.map(m => (
                <div key={m} className="w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 px-3 py-1.5 text-right font-bold">
                  {fmt(monthlyStats[m]?.expected || 0)}
                </div>
              ))}
            </div>

            {/* Optimistic */}
            <div className="flex items-center text-ink-600 dark:text-ink-400">
              <div className="w-[480px] shrink-0 px-3.5 py-1.5 font-medium border-r border-ink-200 dark:border-ink-800">
                • Optimistic (100% of all stages)
              </div>
              {monthKeys.map(m => (
                <div key={m} className="w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 px-3 py-1.5 text-right font-bold text-ink-700 dark:text-ink-300">
                  {fmt(monthlyStats[m]?.optimistic || 0)}
                </div>
              ))}
            </div>
          </div>

          {/* Outflows / Liabilities Section */}
          <div className="bg-ink-50 dark:bg-ink-950 border-t-2 border-ink-200 dark:border-ink-800 p-3 font-bold text-xs uppercase tracking-wider text-ink-600 dark:text-ink-400 flex items-center justify-between">
            <span>Outflows & Liabilities (Monthly burn & commissions)</span>
            <button
              onClick={() => setAddOutflowModalOpen(true)}
              className="text-xs text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1 font-semibold normal-case"
            >
              <Plus size={12} />
              Add outflow line
            </button>
          </div>

          <div className="divide-y divide-ink-100 dark:divide-ink-800 bg-white dark:bg-ink-900 text-xs">
            {/* Dynamic Referral Commission Rows */}
            {referralNames.map(personName => {
              const personData = dynamicReferrals[personName];

              return (
                <div key={`referral_${personName}`} className="flex group bg-ink-50/30 dark:bg-ink-900/40 hover:bg-ink-50/60 dark:hover:bg-ink-800/30 transition-colors">
                  <div className="w-[480px] shrink-0 p-3 border-r border-ink-100 dark:border-ink-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className="text-accent-600 dark:text-accent-400" />
                        <span className="font-semibold text-ink-800 dark:text-ink-200">{personName}</span>
                      </div>
                      <div className="text-[10px] text-ink-500 mt-0.5">
                        Auto-calculated referral commission
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
                      Auto
                    </span>
                  </div>

                  {monthKeys.map(m => {
                    const cutAmount = personData.monthly[m] || 0;
                    return (
                      <div key={m} className="w-[360px] shrink-0 border-r border-ink-100 dark:border-ink-800 last:border-r-0 p-2 flex items-center justify-end">
                        <div className="flex items-center gap-1 text-right">
                          {cutAmount > 0 ? (
                            <span className="font-bold text-negative-600 dark:text-negative-400">
                              -{fmt(cutAmount)}
                            </span>
                          ) : (
                            <span className="text-ink-400 text-xs font-medium">0</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Standard Fixed / Debt Outflows */}
            {outflows.map(item => (
              <div key={item.id} className="flex group hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                <div className="w-[480px] shrink-0 p-3 border-r border-ink-100 dark:border-ink-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-ink-800 dark:text-ink-200">{item.name}</span>
                    {item.initialBalance && (
                      <div className="text-[10px] text-ink-400">
                        Principal: {fmt(item.initialBalance)}
                      </div>
                    )}
                  </div>
                  {item.id !== 'burn_base' && (
                    <IconButton
                      onClick={() => setOutflows(prev => prev.filter(o => o.id !== item.id))}
                      className="opacity-0 group-hover:opacity-100 hover:text-negative-600 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </IconButton>
                  )}
                </div>

                {monthKeys.map(m => {
                  const val = item.monthlyAmounts[m] || 0;
                  return (
                    <div key={m} className="w-[360px] shrink-0 border-r border-ink-100 dark:border-ink-800 last:border-r-0 p-2 flex items-center justify-end">
                      <div className="flex items-center gap-1">
                        <span className="text-negative-500 font-bold">-</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={val === 0 ? '' : val}
                          onChange={e => {
                            const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                            handleUpdateOutflowMonth(item.id, m, num);
                          }}
                          placeholder="0"
                          className="w-24 px-2 py-1 text-right font-bold border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-ink-900 dark:text-ink-100 rounded outline-none focus:border-accent-500 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Outflow Subtotal */}
          <div className="bg-ink-50/70 dark:bg-ink-950/80 border-t border-ink-200 dark:border-ink-800 flex font-bold text-xs">
            <div className="w-[480px] shrink-0 p-3 text-ink-700 dark:text-ink-300 uppercase tracking-wider border-r border-ink-200 dark:border-ink-800">
              Total Outflows
            </div>
            {monthKeys.map(m => {
              const outTotal = monthlyStats[m]?.totalOutflows || 0;
              return (
                <div key={m} className="w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 py-2.5 px-3 text-right text-negative-600 dark:text-negative-400">
                  -{fmt(outTotal)}
                </div>
              );
            })}
          </div>

          {/* Net Cash & Closing Bank Runway Footer */}
          <div className="bg-ink-50 dark:bg-ink-950 border-t-2 border-ink-200 dark:border-ink-800 text-xs">
            {/* Monthly Net Delta */}
            <div className="flex items-center font-bold">
              <div className="w-[480px] shrink-0 p-3.5 border-r border-ink-200 dark:border-ink-800 text-ink-800 dark:text-ink-200">
                Monthly Net Cash (Collections - Outflows)
              </div>
              {monthKeys.map(m => {
                const delta = monthlyStats[m]?.netDelta || 0;
                return (
                  <div 
                    key={m} 
                    className={`w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 p-3 text-right text-sm ${
                      delta >= 0 ? 'text-positive-600 dark:text-positive-400' : 'text-negative-600 dark:text-negative-400'
                    }`}
                  >
                    {delta >= 0 ? '+' : ''}{fmt(delta)}
                  </div>
                );
              })}
            </div>

            {/* Closing Runway in Banks */}
            <div className="flex items-center font-bold bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800">
              <div className="w-[480px] shrink-0 p-4 border-r border-ink-200 dark:border-ink-800 flex items-center gap-2 text-ink-900 dark:text-ink-100 text-sm">
                <DollarSign size={16} className="text-accent-600" />
                <span>Closing Bank Cash</span>
              </div>
              {monthKeys.map(m => {
                const closing = monthlyStats[m]?.closingCash || 0;
                const isDeficit = closing < 0;

                return (
                  <div 
                    key={m} 
                    className={`w-[360px] shrink-0 border-r border-ink-200 dark:border-ink-800 last:border-r-0 p-4 text-right text-base font-extrabold ${
                      isDeficit ? 'text-negative-600 dark:text-negative-400 bg-negative-50/40 dark:bg-negative-950/30' : 'text-accent-700 dark:text-accent-300'
                    }`}
                  >
                    {fmt(closing)}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Pill Modal */}
      <EditPillModal
        isOpen={pillModalOpen}
        pill={editingPill}
        stage={activeCellLocation?.stage || 'possible'}
        onSave={handleSavePill}
        onDelete={handleDeletePill}
        onClose={() => setPillModalOpen(false)}
      />

      {/* Add Row Modal */}
      <AddRowModal
        isOpen={addRowModalOpen}
        onAdd={newRow => setRows(prev => [...prev, newRow])}
        onClose={() => setAddRowModalOpen(false)}
      />

      {/* Edit Row Modal */}
      <EditRowModal
        isOpen={!!editingRow}
        row={editingRow}
        onSave={updatedRow => {
          setRows(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
          setEditingRow(null);
        }}
        onDelete={rowId => {
          setRows(prev => prev.filter(r => r.id !== rowId));
          setEditingRow(null);
        }}
        onClose={() => setEditingRow(null)}
      />

      {/* Reset Single Row Confirmation Modal */}
      <ConfirmModal
        isOpen={!!resetRowTarget}
        title="Reset project row"
        message={`Are you sure you want to reset "${resetRowTarget?.name}" back to its initial baseline milestones? Any manual changes made to this project's pills will be reverted.`}
        confirmText="Reset row"
        onConfirm={() => {
          if (resetRowTarget) {
            handleResetSingleRow(resetRowTarget);
          }
        }}
        onCancel={() => setResetRowTarget(null)}
      />

      {/* Reset Baseline Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmResetBaselineOpen}
        title="Reset to spreadsheet baseline"
        message="This will reset the entire forecast table to the exact 26 workstreams and liabilities from your original financial forecast spreadsheet, including Simon's referral commission tagging. Any unsaved custom modifications will be replaced."
        confirmText="Reset to baseline"
        onConfirm={handleResetToBaseline}
        onCancel={() => setConfirmResetBaselineOpen(false)}
      />

      {/* Sync Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmSyncOpen}
        title="Sync from projects"
        message="This will import your active and proposed fee proposal milestones as workstream rows in the forecast. Existing custom rows will not be overwritten."
        confirmText="Sync now"
        onConfirm={handleSyncFromProjects}
        onCancel={() => setConfirmSyncOpen(false)}
      />

      {/* Delete Row Confirmation */}
      <ConfirmModal
        isOpen={!!deleteRowTarget}
        title="Delete row"
        message="Are you sure you want to delete this workstream row and all its forecast entries?"
        confirmText="Delete"
        onConfirm={() => {
          if (deleteRowTarget) {
            setRows(prev => prev.filter(r => r.id !== deleteRowTarget));
            setDeleteRowTarget(null);
          }
        }}
        onCancel={() => setDeleteRowTarget(null)}
      />
    </div>
  );
}

"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Link2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RefreshCw, 
  Download, 
  Trash2, 
  TrendingUp, 
  ArrowUpRight, 
  Check, 
  FolderSync,
  Landmark,
  RotateCcw,
  UserCheck,
  Edit2,
  Undo2,
  Eye,
  EyeOff,
  Tags
} from 'lucide-react';
import { 
  ForecastProfile, 
  ForecastRow, 
  ForecastPill, 
  ForecastStage, 
  ForecastOutflowItem, 
  Project, 
  Phase, 
  Payment,
  TeamMember,
  Allocation,
  ForecastGroup
} from '@/lib/firebase/schema';
import { 
  getForecastProfile, 
  updateForecastProfile, 
  getProjects, 
  getPhases, 
  getPayments, 
  getTeamMembers,
  getAllocations,
  getProjectCosts,
  getOverheadsProfile,
  getCategories
} from '@/lib/firebase/db';
import { computeProjectFinancials } from '@/lib/utils/projectFinancials';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { SecondaryButton, IconButton, fieldClass } from '@/components/ui/Button';
import { EditPillModal } from './EditPillModal';
import { AddRowModal } from './AddRowModal';
import { EditRowModal } from './EditRowModal';
import { GROUP_COLORS, ManageGroupsModal } from './groups';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Defaults for a company that has no forecast yet. Never put real company data here:
// this file ships to every customer's browser.
const DEFAULT_SETTINGS = {
  visibleMonthsCount: 6,
  startingBankBalance: 0,
  possibleConversion: 50,
  invoicingConversion: 90,
};

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

/** Months since year 0, for comparing and counting YYYY-MM keys. */
function monthIndex(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  return y * 12 + (m - 1);
}

function monthKeyFromDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * An outflow's base amount for a month: the live Team resources + Overheads figure for a linked
 * line; otherwise the month's own entry, or the line's every-month amount.
 */
/**
 * The main running-costs line (burn_base) is linked to Team resources + Overheads by default;
 * it only uses typed amounts once someone unlinks it (linkedToOverheads === false).
 */
function isLinkedLine(item: ForecastOutflowItem): boolean {
  return item.linkedToOverheads ?? item.id === 'burn_base';
}

function outflowBase(item: ForecastOutflowItem, monthKey: string, linkedMonthly: number): number {
  if (isLinkedLine(item)) return linkedMonthly;
  return item.monthlyAmounts?.[monthKey] ?? item.defaultMonthlyAmount ?? 0;
}

/** Base plus the month's +/- adjustment. */
function outflowAmount(item: ForecastOutflowItem, monthKey: string, linkedMonthly: number): number {
  return outflowBase(item, monthKey, linkedMonthly) + (item.monthlyAdjustments?.[monthKey] ?? 0);
}

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function FinancialForecastView() {
  const { formatCurrency, currencyCode } = useAppSettings();
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  // Bank balance, debts and commissions are company finances: admins only (same as Overheads).
  const isAdmin = dbUser?.role === 'admin' || !!user?.email?.toLowerCase().endsWith('@weareenzyme.com');
  const fmt = (val: number) => formatCurrency(Math.round(val), 0, 0);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // True from the first unsaved change until the write lands; used to warn before leaving
  const savePending = useRef(false);
  const [profile, setProfile] = useState<ForecastProfile | null>(null);

  // Global settings
  const [startMonthKey, setStartMonthKey] = useState<string>(getCurrentMonthKey());
  // The opening bank balance is the cash at the start of this month. It stays put when you
  // scroll the window, so closing cash for any month always runs from the same starting point.
  const [openingMonthKey, setOpeningMonthKey] = useState<string>(getCurrentMonthKey());
  const [visibleMonthsCount, setVisibleMonthsCount] = useState<number>(DEFAULT_SETTINGS.visibleMonthsCount);
  const [startingBankBalance, setStartingBankBalance] = useState<number>(DEFAULT_SETTINGS.startingBankBalance);
  const [possibleConversion, setPossibleConversion] = useState<number>(DEFAULT_SETTINGS.possibleConversion);
  const [invoicingConversion, setInvoicingConversion] = useState<number>(DEFAULT_SETTINGS.invoicingConversion);

  // Monthly running costs from the rest of the app, for the line linked to Overheads:
  // all team salaries (Team resources, monthly) + active overhead items (Overheads, yearly / 12).
  // Overheads' "non-billable time" isn't added, since full salaries are already counted.
  const [runningCosts, setRunningCosts] = useState({ salaries: 0, overheads: 0, total: 0 });

  // Rows and Outflows
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [outflows, setOutflows] = useState<ForecastOutflowItem[]>([]);
  // Custom groups (shared, saved with the forecast) and groups switched off for a what-if
  // (this page only, never saved, so it can't change what partners see)
  const [groups, setGroups] = useState<ForecastGroup[]>([]);
  const [disabledGroups, setDisabledGroups] = useState<Set<string>>(new Set());
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const groupById = useMemo(() => Object.fromEntries(groups.map(g => [g.id, g])) as Record<string, ForecastGroup>, [groups]);
  const isOff = (groupId?: string) => !!groupId && !!groupById[groupId] && disabledGroups.has(groupId);
  const toggleGroupEnabled = (groupId: string) => setDisabledGroups(prev => {
    const next = new Set(prev);
    if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
    return next;
  });
  // Lines that count in the totals
  const activeRows = useMemo(() => rows.filter(r => !isOff(r.groupId)), [rows, groupById, disabledGroups]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeOutflows = useMemo(() => outflows.filter(o => !isOff(o.groupId)), [outflows, groupById, disabledGroups]); // eslint-disable-line react-hooks/exhaustive-deps
  // Editing the group list also drops references to deleted groups
  const handleGroupsChange = (next: ForecastGroup[]) => {
    const ids = new Set(next.map(g => g.id));
    setGroups(next);
    setRows(prev => prev.some(r => r.groupId && !ids.has(r.groupId)) ? prev.map(r => (r.groupId && !ids.has(r.groupId) ? { ...r, groupId: undefined } : r)) : prev);
    setOutflows(prev => prev.some(o => o.groupId && !ids.has(o.groupId)) ? prev.map(o => (o.groupId && !ids.has(o.groupId) ? { ...o, groupId: undefined } : o)) : prev);
    setDisabledGroups(prev => new Set([...prev].filter(id => ids.has(id))));
  };

  // Modals state
  const [pillModalOpen, setPillModalOpen] = useState(false);
  const [activeCellLocation, setActiveCellLocation] = useState<{ rowId: string; monthKey: string; stage: ForecastStage } | null>(null);
  const [editingPill, setEditingPill] = useState<ForecastPill | null>(null);

  const [addRowModalOpen, setAddRowModalOpen] = useState(false);
  const [addRowGroupId, setAddRowGroupId] = useState<string | undefined>(undefined);
  const openAddRow = (groupId?: string) => { setAddRowGroupId(groupId); setAddRowModalOpen(true); };
  const [editingRow, setEditingRow] = useState<ForecastRow | null>(null);
  const [resetRowTarget, setResetRowTarget] = useState<ForecastRow | null>(null);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [deleteRowTarget, setDeleteRowTarget] = useState<string | null>(null);

  // Debounced auto-save timer. skipNextSave swallows the state change caused by loading,
  // so simply opening the page never writes anything.
  const skipNextSave = useRef(true);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load the company's saved forecast (a company without one starts empty)
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/overview');
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const [existingProfile, members, overheadsProfile, teamCategories] = await Promise.all([
          getForecastProfile(), getTeamMembers(), getOverheadsProfile(), getCategories(),
        ]);
        // Only the internal team is a fixed monthly cost. Members in an external category
        // (consultants, partner studios) are left out. No category counts as internal.
        const externalCategoryIds = new Set(teamCategories.filter(c => c.type === 'external').map(c => c.id));
        const internalMembers = members.filter(m => !m.category || !externalCategoryIds.has(m.category));
        const salaries = Math.round(internalMembers.reduce((sum, m) => sum + (m.salary || 0), 0));
        const overheadItems = Math.round((overheadsProfile?.categories || [])
          .flatMap(c => c.items || [])
          .filter(i => i.isActive !== false)
          .reduce((sum, i) => sum + (i.yearlyCost || 0), 0) / 12);
        setRunningCosts({ salaries, overheads: overheadItems, total: salaries + overheadItems });
        if (existingProfile) {
          setProfile(existingProfile);
          setStartMonthKey(existingProfile.startMonthKey || getCurrentMonthKey());
          setOpeningMonthKey(existingProfile.openingMonthKey || existingProfile.startMonthKey || getCurrentMonthKey());
          setVisibleMonthsCount(existingProfile.visibleMonthsCount || DEFAULT_SETTINGS.visibleMonthsCount);
          setStartingBankBalance(Math.round(existingProfile.startingBankBalance ?? DEFAULT_SETTINGS.startingBankBalance));
          setPossibleConversion(existingProfile.possibleConversionPercent ?? DEFAULT_SETTINGS.possibleConversion);
          setInvoicingConversion(existingProfile.invoicingConversionPercent ?? DEFAULT_SETTINGS.invoicingConversion);
          setRows(existingProfile.rows || []);
          setOutflows(existingProfile.outflows || []);
          setGroups(existingProfile.groups || []);
        } else {
          // New forecast: start with a running-costs line linked to Team resources + Overheads.
          setOutflows([{
            id: 'burn_base',
            name: 'Running costs (salaries + overheads)',
            type: 'burn',
            linkedToOverheads: true,
            monthlyAmounts: {},
          }]);
        }
      } catch (err) {
        console.error("Error loading forecast data", err);
      } finally {
        skipNextSave.current = true;
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, isAdmin, router]);

  // Debounced auto-save whenever rows, outflows, or settings change
  useEffect(() => {
    if (loading) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    savePending.current = true;

    autoSaveTimeout.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateForecastProfile({
          startMonthKey,
          openingMonthKey,
          visibleMonthsCount,
          startingBankBalance: Math.round(startingBankBalance),
          possibleConversionPercent: Math.round(possibleConversion),
          invoicingConversionPercent: Math.round(invoicingConversion),
          rows,
          outflows,
          groups
        });
        savePending.current = false;
        setSaveError(false);
      } catch (e) {
        console.error("Failed to auto-save forecast", e);
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [loading, startMonthKey, openingMonthKey, visibleMonthsCount, startingBankBalance, possibleConversion, invoicingConversion, rows, outflows, groups]);

  // Warn before reloading or closing the tab while a change hasn't been saved yet
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!savePending.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

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

    activeRows.forEach(row => {
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
  }, [activeRows]);

  const referralNames = useMemo(() => Object.keys(dynamicReferrals).sort(), [dynamicReferrals]);

  // Milestones of one fee proposal as forecast cells: one pill per payment milestone, amount =
  // milestone % x the project's real total fee. Timing (from the project start date + phase durations):
  // - milestones tied to a phase are spread evenly across it: with n on one phase, the k-th lands
  //   k/n of the way through (one milestone = phase end; two = halfway and end);
  // - milestones with no phase follow the schedule order: before any phased milestone = project
  //   start (e.g. mobilisation); after the last one = project end (e.g. final approval); in between =
  //   with the phased milestone just before it.
  // Active projects go to Invoiced, Proposed ones to Possible. Returns null if the project has
  // no fee or payment schedule yet.
  const buildProjectCells = async (
    proj: Project,
    members: TeamMember[],
    allocations: Allocation[]
  ): Promise<ForecastRow['cells'] | null> => {
    const [phases, costs, payments] = await Promise.all([getPhases(proj.id!), getProjectCosts(proj.id!), getPayments(proj.id!)]);
    // Pass every allocation: computeProjectFinancials keeps those on this project's phases, exactly as the
    // fee proposal does. Filtering by allocation.projectId first dropped allocations whose projectId is
    // missing or stale (e.g. copied from a template), so forecast amounts came out lower than the proposal.
    const { totalFee } = computeProjectFinancials(proj, phases, allocations, costs, members);
    if (totalFee <= 0 || payments.length === 0) return null;

    const sortedPhases = [...phases].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const phaseStartWeeks: Record<string, number> = {};
    const phaseDurWeeks: Record<string, number> = {};
    let weeks = 0;
    sortedPhases.forEach(ph => {
      phaseStartWeeks[ph.id!] = weeks;
      phaseDurWeeks[ph.id!] = ph.durationWeeks || 0;
      weeks += ph.durationWeeks || 0;
    });
    const totalWeeks = weeks;
    const projectStart = proj.startDate || Date.now();
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const stage: ForecastStage = proj.status === 'Active' ? 'invoicing' : 'possible';

    const ordered = [...payments].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const isPhased = (p: Payment) => !!p.phaseId && phaseStartWeeks[p.phaseId] !== undefined;
    // Week offset for each milestone
    const perPhaseCount: Record<string, number> = {};
    ordered.forEach(p => { if (isPhased(p)) perPhaseCount[p.phaseId!] = (perPhaseCount[p.phaseId!] || 0) + 1; });
    const perPhaseSeen: Record<string, number> = {};
    const weekOf: number[] = ordered.map(p => {
      if (!isPhased(p)) return NaN;
      const k = (perPhaseSeen[p.phaseId!] = (perPhaseSeen[p.phaseId!] || 0) + 1);
      return phaseStartWeeks[p.phaseId!] + phaseDurWeeks[p.phaseId!] * k / perPhaseCount[p.phaseId!];
    });
    ordered.forEach((p, i) => {
      if (!Number.isNaN(weekOf[i])) return;
      const before = weekOf.slice(0, i).filter(w => !Number.isNaN(w));
      const anyAfter = ordered.slice(i + 1).some(isPhased);
      weekOf[i] = before.length === 0 ? 0 : !anyAfter ? totalWeeks : before[before.length - 1];
    });

    const cells: ForecastRow['cells'] = {};
    ordered.forEach((pmt, i) => {
      const monthKey = monthKeyFromDate(projectStart + weekOf[i] * WEEK);
      const amount = Math.round(totalFee * (pmt.percentage || 0) / 100);
      if (amount <= 0) return;
      if (!cells[monthKey]) cells[monthKey] = {};
      if (!cells[monthKey][stage]) cells[monthKey][stage] = [];
      cells[monthKey][stage]!.push({
        id: `pill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        amount,
        label: pmt.name || 'Milestone',
      });
    });
    return cells;
  };

  // Sync projects from Fee Proposals: adds a row for each Active/Proposed project not in the forecast yet.
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const handleSyncFromProjects = async () => {
    setLoading(true);
    try {
      const [allProjects, members, allocations] = await Promise.all([getProjects(), getTeamMembers(), getAllocations()]);
      const candidates = allProjects.filter(p => !p.isTemplate && (p.status === 'Active' || p.status === 'Proposed'));

      const newRows: ForecastRow[] = [...rows];
      let added = 0;
      const skippedNoFee: string[] = [];

      for (const proj of candidates) {
        const existing = newRows.find(r => r.projectId === proj.id || r.name.toLowerCase() === proj.name.toLowerCase());
        if (existing) continue;
        const cells = await buildProjectCells(proj, members, allocations);
        if (!cells) {
          skippedNoFee.push(proj.name);
          continue;
        }
        newRows.push({
          id: `row_proj_${proj.id}`,
          name: proj.name,
          type: 'project',
          projectId: proj.id,
          notes: proj.status || undefined,
          cells,
        });
        added++;
      }

      setRows(newRows);
      setConfirmSyncOpen(false);
      setSyncMessage(
        `Added ${added} project${added === 1 ? '' : 's'}.` +
        (skippedNoFee.length ? ` Skipped ${skippedNoFee.length} with no fee or payment schedule yet: ${skippedNoFee.join(', ')}.` : '')
      );
    } catch (e) {
      console.error(e);
      setSyncMessage('Sync failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset one row: a project row is rebuilt from its fee proposal; any other row has its amounts cleared.
  const handleResetSingleRow = async (targetRow: ForecastRow) => {
    setLoading(true);
    try {
      let cells: ForecastRow['cells'] = {};
      if (targetRow.projectId) {
        const [allProjects, members, allocations] = await Promise.all([getProjects(), getTeamMembers(), getAllocations()]);
        const proj = allProjects.find(p => p.id === targetRow.projectId);
        cells = (proj && await buildProjectCells(proj, members, allocations)) || {};
      }
      setRows(prev => prev.map(r => r.id === targetRow.id ? { ...r, cells } : r));
      setResetRowTarget(null);
    } catch (err) {
      console.error("Failed to reset row", err);
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
    fromRowId: string, 
    toRowId: string,
    fromMonth: string, 
    fromStage: ForecastStage, 
    toMonth: string, 
    toStage: ForecastStage, 
    pill: ForecastPill,
    copy = false
  ) => {
    if (!copy && fromRowId === toRowId && fromMonth === toMonth && fromStage === toStage) return;
    // Alt+drag leaves the original in place and drops a duplicate with its own id
    const placed = copy
      ? { ...pill, id: `pill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}` }
      : pill;

    setRows(prevRows => prevRows.map(row => {
      if (row.id !== fromRowId && row.id !== toRowId) return row;
      const cells = { ...row.cells };

      // Remove from origin (not when copying)
      if (!copy && row.id === fromRowId && cells[fromMonth]?.[fromStage]) {
        cells[fromMonth] = { ...cells[fromMonth], [fromStage]: cells[fromMonth][fromStage]!.filter(p => p.id !== pill.id) };
      }

      // Add to destination (may be a different row)
      if (row.id === toRowId) {
        const destList = [...(cells[toMonth]?.[toStage] || [])];
        destList.push(placed);
        cells[toMonth] = { ...(cells[toMonth] || {}), [toStage]: destList };
      }

      return { ...row, cells };
    }));
  };

  // Outflow amount change
  // Add outflow: appends a plain line straight into the table and puts its name in edit mode.
  const [editingOutflowId, setEditingOutflowId] = useState<string | null>(null);
  const addOutflowLine = (groupId?: string) => {
    const id = `outflow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setOutflows(prev => [...prev, { id, name: 'New outflow', type: 'custom', monthlyAmounts: {}, groupId }]);
    setEditingOutflowId(id);
  };
  const renameOutflow = (outflowId: string, name: string) => {
    const clean = name.trim();
    if (clean) setOutflows(prev => prev.map(o => (o.id === outflowId ? { ...o, name: clean } : o)));
    setEditingOutflowId(null);
  };

  // Link or unlink a line to Team resources + Overheads. Linking replaces typed month amounts
  // with the live figure; adjustments are kept.
  const handleSetLinked = (outflowId: string, linked: boolean) => {
    setOutflows(prev => prev.map(item => {
      if (item.id !== outflowId) return item;
      if (linked) {
        const next = { ...item, linkedToOverheads: true, monthlyAmounts: {} };
        delete next.defaultMonthlyAmount;
        return next;
      }
      // Unlinking keeps today's figure as the every-month amount, so totals don't jump.
      return { ...item, linkedToOverheads: false, defaultMonthlyAmount: runningCosts.total || undefined };
    }));
  };

  // +/- correction for one month (0 or empty removes it)
  const handleUpdateAdjustment = (outflowId: string, monthKey: string, amount: number) => {
    setOutflows(prev => prev.map(item => {
      if (item.id !== outflowId) return item;
      const monthlyAdjustments = { ...(item.monthlyAdjustments || {}) };
      if (!amount) delete monthlyAdjustments[monthKey];
      else monthlyAdjustments[monthKey] = Math.round(amount);
      return { ...item, monthlyAdjustments };
    }));
  };

  // Amount repeated in every month that has no amount of its own (null switches repeating off)
  const handleUpdateOutflowDefault = (outflowId: string, amount: number | null) => {
    setOutflows(prev => prev.map(item => {
      if (item.id !== outflowId) return item;
      const next = { ...item };
      if (amount === null || amount <= 0) delete next.defaultMonthlyAmount;
      else next.defaultMonthlyAmount = Math.round(amount);
      return next;
    }));
  };

  // amount null clears the month's own value, so the line's default monthly amount applies again
  const handleUpdateOutflowMonth = (outflowId: string, monthKey: string, amount: number | null) => {
    setOutflows(prev => prev.map(item => {
      if (item.id !== outflowId) return item;
      const monthlyAmounts = { ...item.monthlyAmounts };
      if (amount === null) delete monthlyAmounts[monthKey];
      else monthlyAmounts[monthKey] = Math.round(amount);
      return { ...item, monthlyAmounts };
    }));
  };

  // Monthly totals. Closing cash runs from the opening balance at openingMonthKey through every
  // month up to the end of the visible window (including months scrolled out of view), so it
  // doesn't change when the window moves. Months before the opening month have no closing cash.
  const monthlyStats = useMemo(() => {
    type MonthStats = {
      possible: number;
      invoicing: number;
      collections: number;
      conservative: number;
      expected: number;
      optimistic: number;
      totalOutflows: number;
      netDelta: number;
      closingCash: number | null;
    };
    const stats: Record<string, MonthStats> = {};

    const totalsFor = (m: string): Omit<MonthStats, 'closingCash'> => {
      let mPossible = 0;
      let mInvoicing = 0;
      let mCollections = 0;
      activeRows.forEach(r => {
        const cell = r.cells[m];
        if (cell) {
          (cell.possible || []).forEach(p => mPossible += p.amount);
          (cell.invoicing || []).forEach(p => mInvoicing += p.amount);
          (cell.collections || []).forEach(p => mCollections += p.amount);
        }
      });

      // Fixed and debt outflows, plus referral commissions on this month's collections
      let mOutflows = 0;
      activeOutflows.forEach(item => { mOutflows += outflowAmount(item, m, runningCosts.total); });
      Object.values(dynamicReferrals).forEach(refData => { mOutflows += (refData.monthly[m] || 0); });

      return {
        possible: mPossible,
        invoicing: mInvoicing,
        collections: mCollections,
        conservative: mCollections,
        expected: Math.round(mCollections + (mInvoicing * (invoicingConversion / 100)) + (mPossible * (possibleConversion / 100))),
        optimistic: mCollections + mInvoicing + mPossible,
        totalOutflows: mOutflows,
        // Bank cash only moves with real collections minus all outflows
        netDelta: mCollections - mOutflows,
      };
    };

    const lastVisible = monthKeys[monthKeys.length - 1];
    const first = monthIndex(openingMonthKey) < monthIndex(startMonthKey) ? openingMonthKey : startMonthKey;
    const span = monthIndex(lastVisible) - monthIndex(first);
    let runningCash = startingBankBalance;
    for (let i = 0; i <= span; i++) {
      const m = addMonths(first, i);
      const t = totalsFor(m);
      let closingCash: number | null = null;
      if (monthIndex(m) >= monthIndex(openingMonthKey)) {
        runningCash += t.netDelta;
        closingCash = runningCash;
      }
      stats[m] = { ...t, closingCash };
    }

    return stats;
  }, [monthKeys, startMonthKey, openingMonthKey, activeRows, activeOutflows, dynamicReferrals, startingBankBalance, possibleConversion, invoicingConversion, runningCosts.total]);

  // Left column: frozen while scrolling sideways. The notes column can be hidden (remembered per browser).
  const [showNotes, setShowNotes] = useState(true);
  useEffect(() => {
    try { const v = localStorage.getItem('forecast.showNotes'); if (v !== null) setShowNotes(v === '1'); } catch {}
  }, []);
  const toggleNotes = () => setShowNotes(v => {
    try { localStorage.setItem('forecast.showNotes', v ? '0' : '1'); } catch {}
    return !v;
  });
  // Hide rows with no amounts (any stage) in the months on screen. Remembered per browser.
  // Collapsible Inflows / Outflows sections (remembered per browser)
  const [collapsed, setCollapsed] = useState<{ inflows: boolean; outflows: boolean }>({ inflows: false, outflows: false });
  useEffect(() => {
    try {
      setCollapsed({
        inflows: localStorage.getItem('forecast.collapseInflows') === '1',
        outflows: localStorage.getItem('forecast.collapseOutflows') === '1',
      });
    } catch {}
  }, []);
  const toggleSection = (key: 'inflows' | 'outflows') => setCollapsed(prev => {
    const next = { ...prev, [key]: !prev[key] };
    try { localStorage.setItem(key === 'inflows' ? 'forecast.collapseInflows' : 'forecast.collapseOutflows', next[key] ? '1' : '0'); } catch {}
    return next;
  });

  const [hideEmpty, setHideEmpty] = useState(false);
  useEffect(() => {
    try { setHideEmpty(localStorage.getItem('forecast.hideEmpty') === '1'); } catch {}
  }, []);
  const toggleHideEmpty = () => setHideEmpty(v => {
    try { localStorage.setItem('forecast.hideEmpty', v ? '0' : '1'); } catch {}
    return !v;
  });
  const visibleRows = hideEmpty
    ? rows.filter(r => monthKeys.some(m => {
        const c = r.cells[m];
        return !!c && ((c.possible?.length || 0) + (c.invoicing?.length || 0) + (c.collections?.length || 0)) > 0;
      }))
    : rows;
  // Arrows move a row past its visible neighbour, so hidden rows never swallow a click.
  const moveVisible = (row: ForecastRow, dir: -1 | 1, list: ForecastRow[] = visibleRows) => {
    const i = list.indexOf(row);
    const neighbour = list[i + dir];
    if (neighbour) dropRowOn(row.id, neighbour.id, dir < 0 ? 'before' : 'after');
  };

  const NAME_W = 300;
  const NOTES_W = 200;
  const LABEL_W = NAME_W + (showNotes ? NOTES_W : 0);
  const FROZEN_EDGE = 'shadow-[3px_0_4px_-2px_rgba(0,0,0,0.12)]';

  // Row ordering: drag handle (its own MIME type, so it never collides with pill drags) or arrows
  const ROW_MIME = 'application/x-forecast-row';
  const [dropTarget, setDropTarget] = useState<{ rowId: string; pos: 'before' | 'after' } | null>(null);
  const moveRow = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setRows(prev => {
      if (fromIdx >= prev.length || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };
  const dropRowOn = (draggedId: string, targetId: string, pos: 'before' | 'after') => {
    setRows(prev => {
      const from = prev.findIndex(r => r.id === draggedId);
      if (from < 0 || draggedId === targetId) return prev;
      const next = [...prev];
      const [picked] = next.splice(from, 1);
      const targetIdx = next.findIndex(r => r.id === targetId);
      const moved = { ...picked, groupId: next[targetIdx]?.groupId };
      next.splice(pos === 'before' ? targetIdx : targetIdx + 1, 0, moved);
      return next;
    });
  };

  // Sum of a per-month value over the months on screen (for the totals column)
  const sumVisible = (fn: (m: string) => number) => monthKeys.reduce((sum, m) => sum + fn(m), 0);

  // --- Groups: sections, collapse state, subtotal bars ---
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  useEffect(() => {
    try { setCollapsedGroups(new Set(JSON.parse(localStorage.getItem('forecast.collapsedGroups') || '[]'))); } catch {}
  }, []);
  const toggleGroupCollapsed = (key: string) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    try { localStorage.setItem('forecast.collapsedGroups', JSON.stringify([...next])); } catch {}
    return next;
  });
  // Groups in their saved order, then lines with no group. One plain section when there are no groups.
  function sectionsOf<T extends { groupId?: string }>(items: T[], prefix: string) {
    // Only groups with lines in this section get a bar (inflow and outflow groups can differ).
    // A section where nothing is grouped stays a plain list.
    if (!items.some(i => i.groupId && groupById[i.groupId])) {
      return [{ key: `${prefix}:all`, group: null as ForecastGroup | null, items, showBar: false }];
    }
    const out = groups
      .map(g => ({ key: `${prefix}:${g.id}`, group: g as ForecastGroup | null, items: items.filter(i => i.groupId === g.id), showBar: true }))
      .filter(sct => sct.items.length > 0);
    const rest = items.filter(i => !i.groupId || !groupById[i.groupId]);
    if (rest.length) out.push({ key: `${prefix}:__none`, group: null, items: rest, showBar: true });
    return out;
  }
  // Dims a line or bar but keeps the frozen label's background opaque (and keeps .keep-on controls bright)
  const OFF_DIM = '[&>*:not(.sticky)]:opacity-40 [&>.sticky>*:not(.keep-on)]:opacity-40';
  const groupUsage = useMemo(() => {
    const u: Record<string, number> = {};
    [...rows, ...outflows].forEach(l => { if (l.groupId) u[l.groupId] = (u[l.groupId] || 0) + 1; });
    return u;
  }, [rows, outflows]);
  const groupBarLabel = (key: string, group: ForecastGroup | null, count: number, onAdd: () => void, addLabel: string) => {
    const off = !!group && disabledGroups.has(group.id);
    const open = !collapsedGroups.has(key);
    return (
      <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} ${group ? GROUP_COLORS[group.color].stripe : ''} border-r-2 border-ink-200 dark:border-ink-700 pl-3 pr-2 py-2 flex items-center justify-between gap-2`}>
        <button onClick={() => toggleGroupCollapsed(key)} aria-expanded={open} className="flex items-center gap-1.5 min-w-0 text-ink-800 dark:text-ink-200 hover:text-ink-950 dark:hover:text-ink-50">
          <ChevronRight size={13} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${group ? GROUP_COLORS[group.color].dot : 'bg-ink-300 dark:bg-ink-600'}`} />
          <span className={`truncate ${off ? 'line-through' : ''}`}>{group ? group.name : 'No group'}</span>
          <span className="shrink-0 font-medium text-ink-500 dark:text-ink-400">({count})</span>
        </button>
        <div className="keep-on shrink-0 flex items-center gap-1">
        <button
          onClick={onAdd}
          className="w-6 h-6 flex items-center justify-center rounded-md text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-accent-700 dark:hover:text-accent-400 transition-colors"
          title={`${addLabel}${group ? ` to ${group.name}` : ' with no group'}`}
          aria-label={`${addLabel}${group ? ` to ${group.name}` : ' with no group'}`}
        >
          <Plus size={14} />
        </button>
        {group && (
          <button
            onClick={() => toggleGroupEnabled(group.id)}
            className={`keep-on shrink-0 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${
              off ? 'bg-ink-200 dark:bg-ink-800 text-ink-700 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
            }`}
            title={off ? 'Excluded from all totals. Click to include it again.' : 'Exclude this group from all totals to see its effect. Only on this page; nothing is saved.'}
            aria-pressed={off}
          >
            {off ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{off ? 'Excluded' : 'Included'}</span>
          </button>
        )}
        </div>
      </div>
    );
  };
  const stageSum = (items: ForecastRow[], m: string, st: ForecastStage) =>
    items.reduce((sum, r) => sum + (r.cells[m]?.[st] || []).reduce((a, p) => a + p.amount, 0), 0);
  const renderInflowGroupBar = (key: string, group: ForecastGroup | null, items: ForecastRow[]) => {
    const off = !!group && disabledGroups.has(group.id);
    const cell = (v: number, cls: string) => <span className={`flex items-center justify-center ${cls}`}>{v ? fmt(v) : ''}</span>;
    return (
      <div className={`flex bg-ink-50 dark:bg-ink-950 text-xs font-semibold tabular-nums ${off ? OFF_DIM : ''}`}>
        {groupBarLabel(key, group, items.length, () => openAddRow(group?.id), 'Add income')}
        {monthKeys.map(m => (
          <div key={m} className="w-[360px] shrink-0 grid grid-cols-3 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 py-2 px-1.5 text-center">
            {cell(stageSum(items, m, 'possible'), 'text-warning-700 dark:text-warning-300')}
            {cell(stageSum(items, m, 'invoicing'), 'text-accent-700 dark:text-accent-300 border-x border-ink-200 dark:border-ink-800')}
            {cell(stageSum(items, m, 'collections'), 'text-positive-700 dark:text-positive-300')}
          </div>
        ))}
        <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 grid grid-cols-3 py-2 px-1.5 text-center">
          {cell(sumVisible(m => stageSum(items, m, 'possible')), 'text-warning-700 dark:text-warning-300')}
          {cell(sumVisible(m => stageSum(items, m, 'invoicing')), 'text-accent-700 dark:text-accent-300 border-x border-ink-200 dark:border-ink-800')}
          {cell(sumVisible(m => stageSum(items, m, 'collections')), 'text-positive-700 dark:text-positive-300')}
        </div>
      </div>
    );
  };
  const renderOutflowGroupBar = (key: string, group: ForecastGroup | null, items: ForecastOutflowItem[]) => {
    const off = !!group && disabledGroups.has(group.id);
    const monthTotal = (m: string) => items.reduce((sum, it) => sum + outflowAmount(it, m, runningCosts.total), 0);
    return (
      <div className={`flex bg-ink-50 dark:bg-ink-950 text-xs font-semibold tabular-nums ${off ? OFF_DIM : ''}`}>
        {groupBarLabel(key, group, items.length, () => addOutflowLine(group?.id), 'Add outflow')}
        {monthKeys.map(m => {
          const v = monthTotal(m);
          return (
            <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 py-2 px-3 text-right text-negative-600 dark:text-negative-400">
              {v ? `-${fmt(v)}` : ''}
            </div>
          );
        })}
        <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 py-2 px-3 text-right text-negative-600 dark:text-negative-400">
          {(() => { const t = sumVisible(monthTotal); return t ? `-${fmt(t)}` : ''; })()}
        </div>
      </div>
    );
  };

  if (authLoading || !isAdmin || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-ink-500">
        <RefreshCw size={24} className="animate-spin mr-2 text-accent-500" />
        <span className="text-sm font-semibold">Loading financial forecast…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden font-sans">
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
            <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Opening bank cash</span>
            <div className="flex items-center gap-1 font-bold text-sm text-ink-900 dark:text-ink-100">
              <span className="text-xs text-ink-500 dark:text-ink-400">{currencyCode}</span>
              <input
                type="text"
                inputMode="numeric"
                value={startingBankBalance === 0 ? '' : startingBankBalance.toLocaleString('en-US')}
                onChange={e => {
                  // Thousand separators are display only; keep digits and a leading minus
                  const raw = e.target.value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '');
                  setStartingBankBalance(parseInt(raw, 10) || 0);
                }}
                placeholder="0"
                className="w-28 bg-transparent outline-none text-right font-bold tabular-nums"
                aria-label="Opening bank cash"
              />
            </div>
            <span className="text-xs font-medium text-ink-500 dark:text-ink-400">at start of</span>
            <input
              type="month"
              value={openingMonthKey}
              onChange={e => e.target.value && setOpeningMonthKey(e.target.value)}
              className="bg-transparent text-xs font-semibold outline-none text-ink-800 dark:text-ink-200"
              aria-label="Month the opening bank cash applies to"
            />
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
                <span className="font-bold text-ink-500 dark:text-ink-400">%</span>
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
                <span className="font-bold text-ink-500 dark:text-ink-400">%</span>
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

          {/* Sync from Projects */}
          <SecondaryButton onClick={() => setConfirmSyncOpen(true)}>
            <FolderSync size={14} />
            <span>Sync projects</span>
          </SecondaryButton>

          <SecondaryButton onClick={() => setManageGroupsOpen(true)} title="Create, rename, recolour or delete groups">
            <Tags size={14} />
            <span>Groups</span>
          </SecondaryButton>

          {isSaving ? (
            <span className="text-[11px] text-ink-500 dark:text-ink-400 italic">Saving…</span>
          ) : saveError ? (
            <span className="text-[11px] font-semibold text-negative-600 dark:text-negative-400">Couldn't save. Your changes will be retried on the next edit.</span>
          ) : null}
        </div>
      </div>

      {disabledGroups.size > 0 && (
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-lg border border-warning-200 dark:border-warning-800/60 bg-warning-50 dark:bg-warning-950/40 text-sm text-warning-800 dark:text-warning-200 flex items-center justify-between gap-4">
          <span>
            Excluded from totals: <span className="font-semibold">{[...disabledGroups].map(id => groupById[id]?.name).filter(Boolean).join(', ')}</span>. Only on this page; nothing is saved.
          </span>
          <button onClick={() => setDisabledGroups(new Set())} className="shrink-0 font-semibold hover:underline">Include all</button>
        </div>
      )}

      {syncMessage && (
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-lg border border-accent-200 dark:border-accent-800/60 bg-accent-50 dark:bg-accent-950/40 text-sm text-accent-800 dark:text-accent-200 flex items-center justify-between gap-4">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-xs font-semibold hover:underline shrink-0">Dismiss</button>
        </div>
      )}

      {/* Main Forecast Matrix Table */}
      {/* No padding on the scroller: sticky header/column stop at the padding edge, which let cells show through. The card margins keep the spacing. */}
      <div className="flex-1 overflow-auto pb-6">
        {/* overflow-clip (not hidden): still rounds the corners, but isn't a scroll container, so the month header can stick */}
        <Card className="min-w-fit shadow-sm overflow-clip mt-6 mx-6">
          {/* Matrix Header */}
          <div className="bg-ink-50 dark:bg-ink-950 border-b border-ink-200 dark:border-ink-800 flex sticky top-0 z-30 shadow-[0_1px_0_var(--ink-200)]">
            {/* Frozen left header: workstream (+ notes) */}
            <div className={`sticky left-0 z-10 flex shrink-0 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE}`}>
              <div
                style={{ width: NAME_W }}
                className={`shrink-0 px-3.5 py-2.5 font-semibold text-xs text-ink-500 dark:text-ink-400 flex items-center ${showNotes ? 'border-r border-ink-200 dark:border-ink-800' : 'border-r-2 border-ink-200 dark:border-ink-700'}`}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="whitespace-nowrap">
                    Workstream <span className="font-medium">· {visibleRows.length === rows.length ? `${rows.length} ${rows.length === 1 ? 'row' : 'rows'}` : `${visibleRows.length} of ${rows.length} rows`}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <button
                      onClick={toggleHideEmpty}
                      className="text-[11px] font-semibold text-accent-700 dark:text-accent-400 hover:underline whitespace-nowrap"
                      title={hideEmpty ? 'Show rows with no amounts in these months' : 'Hide rows with no amounts in these months'}
                    >
                      {hideEmpty ? 'Show empty rows' : 'Hide empty rows'}
                    </button>
                    <button
                      onClick={toggleNotes}
                      className="text-[11px] font-semibold text-accent-700 dark:text-accent-400 hover:underline whitespace-nowrap"
                      title={showNotes ? 'Hide the notes column' : 'Show the notes column'}
                    >
                      {showNotes ? 'Hide notes' : 'Show notes'}
                    </button>
                  </span>
                </div>
              </div>
              {showNotes && (
                <div style={{ width: NOTES_W }} className="shrink-0 p-3.5 font-semibold text-xs text-ink-500 dark:text-ink-400 border-r-2 border-ink-200 dark:border-ink-700 flex items-center">
                  Notes
                </div>
              )}
            </div>

            {/* Month Column Headers with 3 stage sub-columns: 360px per month */}
            {monthKeys.map(m => (
              <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 flex flex-col">
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
            {/* Totals for the visible months */}
            <div className="w-[360px] shrink-0 flex flex-col bg-ink-100/70 dark:bg-ink-900">
              <div className="text-center py-2 border-b border-ink-200 dark:border-ink-800 font-bold text-xs text-ink-900 dark:text-ink-100">
                Total, {monthKeys.length} months
              </div>
              <div className="grid grid-cols-3 text-[11px] font-semibold text-center py-1 text-ink-500">
                <span className="text-warning-600 dark:text-warning-400 py-0.5">Possible</span>
                <span className="text-accent-600 dark:text-accent-400 py-0.5 border-x border-ink-200 dark:border-ink-800">Invoiced</span>
                <span className="text-positive-600 dark:text-positive-400 py-0.5">Collections</span>
              </div>
            </div>
          </div>

          {/* Inflows section bar (collapses the income rows; totals stay visible) */}
          <div className="bg-ink-50 dark:bg-ink-950 border-b border-ink-200 dark:border-ink-800 font-semibold text-xs text-ink-700 dark:text-ink-300">
            <div style={{ width: LABEL_W }} className="sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 p-3 flex items-center justify-between gap-3">
              <button
                onClick={() => toggleSection('inflows')}
                aria-expanded={!collapsed.inflows}
                className="flex items-center gap-1.5 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
              >
                <ChevronRight size={14} className={`transition-transform ${collapsed.inflows ? '' : 'rotate-90'}`} />
                <span>Inflows</span>
                <span className="font-medium text-ink-500 dark:text-ink-400">({visibleRows.length})</span>
              </button>
              <button
                onClick={() => openAddRow()}
                className="shrink-0 text-xs text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus size={12} />
                Add income
              </button>
            </div>
          </div>

          {/* Workstream Inflow Rows */}
          <div className={`divide-y divide-ink-100 dark:divide-ink-800 bg-white dark:bg-ink-900 ${collapsed.inflows ? 'hidden' : ''}`}>
            {rows.length === 0 && (
              <div className="px-6 py-10 text-sm text-ink-500 dark:text-ink-400 max-w-xl">
                <p className="font-semibold text-ink-800 dark:text-ink-200 mb-1">No income rows yet</p>
                <p>Use <span className="font-semibold">Sync projects</span> to bring in milestones from your fee proposals, or <span className="font-semibold">Add income</span> for retainers and other income. Then click a cell to add an amount.</p>
              </div>
            )}
            {rows.length > 0 && visibleRows.length === 0 && (
              <div className="px-6 py-6 text-sm text-ink-500 dark:text-ink-400">
                No rows have amounts in these months. <button onClick={toggleHideEmpty} className="font-semibold text-accent-700 dark:text-accent-400 hover:underline">Show empty rows</button>
              </div>
            )}
            {sectionsOf(visibleRows, 'in').map(section => (
              <React.Fragment key={section.key}>
              {section.showBar && renderInflowGroupBar(section.key, section.group, section.items)}
              {!(section.showBar && collapsedGroups.has(section.key)) && section.items.map((row, rowIdx) => {
              // Group colour stripe drawn inside the first cell (inset shadow), so it takes no width and
              // rows stay aligned with the header and totals.
              const rowGroup = row.groupId ? groupById[row.groupId] : undefined;
              const tagStripe = rowGroup ? GROUP_COLORS[rowGroup.color].stripe : '';
              const rowOff = isOff(row.groupId);

              return (
                <div
                  key={row.id}
                  data-forecast-row={row.id}
                  onDragOver={e => {
                    if (!e.dataTransfer.types.includes(ROW_MIME)) return;
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                    if (dropTarget?.rowId !== row.id || dropTarget.pos !== pos) setDropTarget({ rowId: row.id, pos });
                  }}
                  onDrop={e => {
                    if (!e.dataTransfer.types.includes(ROW_MIME)) return;
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData(ROW_MIME);
                    if (draggedId && dropTarget) dropRowOn(draggedId, row.id, dropTarget.pos);
                    setDropTarget(null);
                  }}
                  className={`flex group hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors ${rowOff ? OFF_DIM : ''} ${
                    dropTarget?.rowId === row.id
                      ? dropTarget.pos === 'before' ? 'shadow-[inset_0_2px_0_var(--accent-500)]' : 'shadow-[inset_0_-2px_0_var(--accent-500)]'
                      : ''
                  }`}
                >
                  {/* Frozen left: name, tags and actions (+ notes) */}
                  <div className={`sticky left-0 z-10 flex shrink-0 bg-white dark:bg-ink-900 group-hover:bg-ink-50 dark:group-hover:bg-ink-800 transition-colors ${FROZEN_EDGE}`}>
                  <div
                    style={{ width: NAME_W }}
                    className={`shrink-0 py-2.5 pr-2 pl-1.5 flex items-start gap-1 ${tagStripe} ${showNotes ? 'border-r border-ink-100 dark:border-ink-800' : 'border-r-2 border-ink-200 dark:border-ink-700'}`}
                  >
                    <span
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData(ROW_MIME, row.id);
                        e.dataTransfer.effectAllowed = 'move';
                        const rowEl = (e.currentTarget as HTMLElement).closest('[data-forecast-row]');
                        if (rowEl) e.dataTransfer.setDragImage(rowEl, 20, 20);
                      }}
                      onDragEnd={() => setDropTarget(null)}
                      className="shrink-0 mt-0.5 p-0.5 rounded cursor-grab active:cursor-grabbing text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Drag to reorder"
                    >
                      <GripVertical size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Line 1: name, full width. Linked rows open the project in Projects & phases. */}
                      {row.projectId ? (
                        <Link
                          href={`/projects?project=${row.projectId}`}
                          className="block font-semibold text-sm text-ink-900 dark:text-ink-100 truncate hover:text-accent-700 dark:hover:text-accent-300 hover:underline"
                          title={`${row.name}: open in Projects & phases`}
                        >
                          {row.name}
                        </Link>
                      ) : (
                        <div className="font-semibold text-sm text-ink-900 dark:text-ink-100 truncate" title={row.name}>
                          {row.name}
                        </div>
                      )}
                      {/* Line 2: tags left, small actions right */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] px-1.5 py-px rounded font-semibold capitalize whitespace-nowrap ${
                            row.type === 'external' ? 'bg-negative-50 text-negative-700 dark:bg-negative-950/40 dark:text-negative-400' :
                            row.type === 'retainer' ? 'bg-positive-50 text-positive-700 dark:bg-positive-950/40 dark:text-positive-400' :
                            'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400'
                          }`}>
                            {row.type}
                          </span>
                          {row.projectId ? (
                            <Link
                              href={`/dashboard?project=${row.projectId}`}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-px rounded font-semibold whitespace-nowrap bg-accent-100 text-accent-800 dark:bg-accent-900/60 dark:text-accent-200 hover:underline"
                              title="Synced from a fee proposal. Click to open the proposal."
                            >
                              <Link2 size={10} />
                              Proposal
                            </Link>
                          ) : (
                            <span className="text-[10px] font-medium text-ink-500 dark:text-ink-400 whitespace-nowrap" title="Added by hand in the forecast, not linked to a fee proposal">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                          <IconButton onClick={() => moveVisible(row, -1, section.items)} disabled={rowIdx === 0} className="w-6 h-6 hover:text-accent-600" title="Move up"><ArrowUp size={12} /></IconButton>
                          <IconButton onClick={() => moveVisible(row, 1, section.items)} disabled={rowIdx === section.items.length - 1} className="w-6 h-6 hover:text-accent-600" title="Move down"><ArrowDown size={12} /></IconButton>
                          <IconButton onClick={() => setEditingRow(row)} className="w-6 h-6 hover:text-accent-600" title="Edit row"><Edit2 size={12} /></IconButton>
                          <IconButton onClick={() => setResetRowTarget(row)} className="w-6 h-6 hover:text-warning-600" title="Reset row: re-sync from its fee proposal, or clear its amounts"><Undo2 size={12} /></IconButton>
                          <IconButton onClick={() => setDeleteRowTarget(row.id)} className="w-6 h-6 hover:text-negative-600" title="Delete row"><Trash2 size={12} /></IconButton>
                        </div>
                      </div>
                    </div>
                  </div>
                  {showNotes && (
                    <div
                      onClick={() => setEditingRow(row)}
                      style={{ width: NOTES_W }}
                      className="shrink-0 p-3 border-r-2 border-ink-200 dark:border-ink-700 flex items-center text-xs text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-ink-100/40 dark:hover:bg-ink-800/40 transition-colors overflow-hidden"
                      title="Click to edit notes"
                    >
                      {row.notes ? (
                        <span className="truncate italic">{row.notes}</span>
                      ) : (
                        <span className="text-ink-500 dark:text-ink-400 italic text-[11px] group-hover:inline hidden">+ Add a note</span>
                      )}
                    </div>
                  )}
                  </div>

                  {/* 3 Stage Cells for Each Month (360px per month) */}
                  {monthKeys.map(m => {
                    const monthCell = row.cells[m] || {};

                    return (
                      <div key={m} className="w-[360px] shrink-0 grid grid-cols-3 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 min-h-[56px]">
                        {(['possible', 'invoicing', 'collections'] as ForecastStage[]).map((stage, colIdx) => {
                          const pills = monthCell[stage] || [];
                          const borderClasses = colIdx === 1 ? 'border-x border-ink-100 dark:border-ink-800/60' : '';

                          return (
                            <div 
                              key={stage}
                              onDragOver={e => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
                              }}
                              onDrop={e => {
                                e.preventDefault();
                                try {
                                  const raw = e.dataTransfer.getData('text/plain');
                                  if (!raw) return; // e.g. a row being reordered, handled by the row
                                  const data = JSON.parse(raw);
                                  if (data && data.pill) {
                                    handleMovePill(data.fromRowId, row.id, data.fromMonth, data.fromStage, m, stage, data.pill, e.altKey);
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
                                    e.dataTransfer.effectAllowed = 'copyMove';
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
                                  title={`${pill.label}${pill.referralName ? ` • Referral: ${pill.referralName} (${pill.referralPercent || 0}%)` : ''}${pill.invoiceNumber ? ` • Inv #${pill.invoiceNumber}` : ''}${pill.notes ? ` • ${pill.notes}` : ''}\nDrag to move · Alt+drag to copy`}
                                >
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="truncate">{pill.label}</span>
                                    {pill.referralName && (
                                      <span className="shrink-0 text-[9px] px-1 py-px rounded bg-ink-200/80 dark:bg-ink-700 text-ink-700 dark:text-ink-200 font-semibold" title={`Referral: ${pill.referralName} (${pill.referralPercent || 0}%)`}>
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
                  {(() => {
                    const stageTotal = (st: ForecastStage) => sumVisible(m => (row.cells[m]?.[st] || []).reduce((s, p) => s + p.amount, 0));
                    const t = { possible: stageTotal('possible'), invoicing: stageTotal('invoicing'), collections: stageTotal('collections') };
                    return (
                      <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums grid grid-cols-3 text-xs font-bold text-center">
                        <span className="flex items-center justify-center text-warning-700 dark:text-warning-300">{t.possible ? fmt(t.possible) : ''}</span>
                        <span className="flex items-center justify-center text-accent-700 dark:text-accent-300 border-x border-ink-200 dark:border-ink-800">{t.invoicing ? fmt(t.invoicing) : ''}</span>
                        <span className="flex items-center justify-center text-positive-700 dark:text-positive-300">{t.collections ? fmt(t.collections) : ''}</span>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
              </React.Fragment>
            ))}
          </div>

          {/* Subtotals by Stage */}
          <div className="bg-ink-50/70 dark:bg-ink-950/80 border-t-2 border-ink-200 dark:border-ink-800 flex font-bold text-xs">
            <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} p-3 text-ink-700 dark:text-ink-300 border-r-2 border-ink-200 dark:border-ink-700`}>
              Total inflows
            </div>
            {monthKeys.map(m => {
              const st = monthlyStats[m] || { possible: 0, invoicing: 0, collections: 0 };
              return (
                <div key={m} className="w-[360px] shrink-0 grid grid-cols-3 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 py-2.5 px-1.5 text-center">
                  <span className="text-warning-700 dark:text-warning-300">{fmt(st.possible)}</span>
                  <span className="text-accent-700 dark:text-accent-300 border-x border-ink-200 dark:border-ink-800">{fmt(st.invoicing)}</span>
                  <span className="text-positive-700 dark:text-positive-300">{fmt(st.collections)}</span>
                </div>
              );
            })}
            <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums grid grid-cols-3 py-2.5 px-1.5 text-center">
              <span className="text-warning-700 dark:text-warning-300">{fmt(sumVisible(m => monthlyStats[m]?.possible || 0))}</span>
              <span className="text-accent-700 dark:text-accent-300 border-x border-ink-200 dark:border-ink-800">{fmt(sumVisible(m => monthlyStats[m]?.invoicing || 0))}</span>
              <span className="text-positive-700 dark:text-positive-300">{fmt(sumVisible(m => monthlyStats[m]?.collections || 0))}</span>
            </div>
          </div>

          {/* Scenarios Breakdown (Conservative / Expected / Optimistic) */}
          <div className="bg-ink-100/40 dark:bg-ink-950/40 border-t border-ink-200 dark:border-ink-800 divide-y divide-ink-100 dark:divide-ink-800 text-xs">
            {/* Conservative */}
            <div className="flex items-center text-ink-600 dark:text-ink-400">
              <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} px-3.5 py-1.5 font-medium border-r-2 border-ink-200 dark:border-ink-700`}>
                Conservative (collections only)
              </div>
              {monthKeys.map(m => (
                <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 px-3 py-1.5 text-right font-bold text-ink-700 dark:text-ink-300">
                  {fmt(monthlyStats[m]?.conservative || 0)}
                </div>
              ))}
              <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums px-3 py-1.5 text-right font-bold text-ink-800 dark:text-ink-200">{fmt(sumVisible(m => monthlyStats[m]?.conservative || 0))}</div>
            </div>

            {/* Expected */}
            <div className="flex items-center text-accent-700 dark:text-accent-300 bg-accent-50/30 dark:bg-accent-950/20 font-semibold">
              <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} px-3.5 py-1.5 border-r-2 border-ink-200 dark:border-ink-700`}>
                Expected (collections + {invoicingConversion}% invoiced + {possibleConversion}% possible)
              </div>
              {monthKeys.map(m => (
                <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 px-3 py-1.5 text-right font-bold">
                  {fmt(monthlyStats[m]?.expected || 0)}
                </div>
              ))}
              <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums px-3 py-1.5 text-right font-bold">{fmt(sumVisible(m => monthlyStats[m]?.expected || 0))}</div>
            </div>

            {/* Optimistic */}
            <div className="flex items-center text-ink-600 dark:text-ink-400">
              <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} px-3.5 py-1.5 font-medium border-r-2 border-ink-200 dark:border-ink-700`}>
                Optimistic (all stages in full)
              </div>
              {monthKeys.map(m => (
                <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 px-3 py-1.5 text-right font-bold text-ink-700 dark:text-ink-300">
                  {fmt(monthlyStats[m]?.optimistic || 0)}
                </div>
              ))}
              <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums px-3 py-1.5 text-right font-bold text-ink-800 dark:text-ink-200">{fmt(sumVisible(m => monthlyStats[m]?.optimistic || 0))}</div>
            </div>
          </div>

          {/* Outflows / Liabilities Section */}
          <div className="bg-ink-50 dark:bg-ink-950 border-t-2 border-ink-200 dark:border-ink-800 font-semibold text-xs text-ink-700 dark:text-ink-300">
            {/* Frozen with the other row labels so it doesn't scroll away sideways */}
            <div style={{ width: LABEL_W }} className="sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 p-3 flex items-center justify-between gap-3">
              <button
                onClick={() => toggleSection('outflows')}
                aria-expanded={!collapsed.outflows}
                title="Monthly costs, debt and commissions"
                className="flex items-center gap-1.5 min-w-0 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
              >
                <ChevronRight size={14} className={`shrink-0 transition-transform ${collapsed.outflows ? '' : 'rotate-90'}`} />
                <span className="truncate">Outflows</span>
                <span className="font-medium text-ink-500 dark:text-ink-400">({referralNames.length + outflows.length})</span>
              </button>
              <button
                onClick={() => addOutflowLine()}
                className="shrink-0 text-xs text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus size={12} />
                Add outflow
              </button>
            </div>
          </div>

          <div className={`divide-y divide-ink-100 dark:divide-ink-800 bg-white dark:bg-ink-900 text-xs ${collapsed.outflows ? 'hidden' : ''}`}>
            {/* Dynamic Referral Commission Rows */}
            {referralNames.map(personName => {
              const personData = dynamicReferrals[personName];

              return (
                <div key={`referral_${personName}`} className="flex group bg-ink-50/30 dark:bg-ink-900/40 hover:bg-ink-50/60 dark:hover:bg-ink-800/30 transition-colors">
                  <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-white dark:bg-ink-900 ${FROZEN_EDGE} p-3 border-r-2 border-ink-200 dark:border-ink-700 flex items-center justify-between`}>
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
                      <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 p-2 flex items-center justify-end">
                        <div className="flex items-center gap-1 text-right">
                          {cutAmount > 0 ? (
                            <span className="font-bold text-negative-600 dark:text-negative-400">
                              -{fmt(cutAmount)}
                            </span>
                          ) : (
                            <span className="text-ink-500 dark:text-ink-400 text-xs font-medium">0</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums p-2 flex items-center justify-end font-bold text-negative-600 dark:text-negative-400">
                    {(() => { const t = sumVisible(m => personData.monthly[m] || 0); return t ? `-${fmt(t)}` : <span className="text-ink-500 dark:text-ink-400 font-medium">0</span>; })()}
                  </div>
                </div>
              );
            })}

            {/* Standard fixed / debt outflows */}
            {sectionsOf(outflows, 'out').map(section => (
              <React.Fragment key={section.key}>
              {section.showBar && renderOutflowGroupBar(section.key, section.group, section.items)}
              {!(section.showBar && collapsedGroups.has(section.key)) && section.items.map(item => {
              const isLinked = isLinkedLine(item);
              const itemGroup = item.groupId ? groupById[item.groupId] : undefined;
              const itemOff = isOff(item.groupId);
              const canLink = item.type === 'burn';
              const showAdjust = item.type === 'burn';
              return (
              <div key={item.id} className={`flex group hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors ${itemOff ? OFF_DIM : ''}`}>
                <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-white dark:bg-ink-900 ${FROZEN_EDGE} ${itemGroup ? GROUP_COLORS[itemGroup.color].stripe : ''} p-3 border-r-2 border-ink-200 dark:border-ink-700 flex items-center justify-between gap-3`}>
                  <div className="min-w-0 flex-1">
                    {editingOutflowId === item.id ? (
                      <input
                        autoFocus
                        defaultValue={item.name}
                        onFocus={e => e.currentTarget.select()}
                        onBlur={e => renameOutflow(item.id, e.currentTarget.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditingOutflowId(null);
                        }}
                        className={fieldClass + ' w-full py-1 text-xs font-semibold'}
                        aria-label="Outflow name"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingOutflowId(item.id)}
                        className="block max-w-full truncate text-left font-semibold text-ink-800 dark:text-ink-200 hover:underline decoration-dotted underline-offset-2"
                        title="Click to rename"
                      >
                        {item.name}
                      </button>
                    )}
                    {isLinked && (
                      <div
                        className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5"
                        title={`Internal team salaries (Team resources): ${fmt(runningCosts.salaries)} a month\nOverhead items (Overheads): ${fmt(runningCosts.overheads)} a month\nUpdates automatically when either page changes.`}
                      >
                        Internal team + Overheads: <span className="font-semibold text-ink-700 dark:text-ink-300">{fmt(runningCosts.total)}</span> a month
                        <button onClick={() => handleSetLinked(item.id, false)} className="ml-2 font-semibold text-accent-700 dark:text-accent-400 hover:underline">Unlink</button>
                      </div>
                    )}
                    {!isLinked && canLink && (
                      <button
                        onClick={() => handleSetLinked(item.id, true)}
                        className="block text-[11px] font-semibold text-accent-700 dark:text-accent-400 hover:underline mt-0.5"
                        title="Use monthly salaries from Team resources plus overhead items from Overheads, kept up to date automatically. Month amounts you typed are replaced; corrections are kept."
                      >
                        Link to Team resources + Overheads
                      </button>
                    )}
                    {groups.length > 0 && (
                      <select
                        value={item.groupId && groupById[item.groupId] ? item.groupId : ''}
                        onChange={e => {
                          const gid = e.target.value || undefined;
                          setOutflows(prev => prev.map(o => (o.id === item.id ? { ...o, groupId: gid } : o)));
                        }}
                        className="mt-1 -ml-0.5 max-w-full bg-transparent text-[11px] text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 cursor-pointer rounded focus:outline-none"
                        aria-label="Group"
                        title="Group"
                      >
                        <option value="">No group</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    )}
                  </div>
                  {item.id !== 'burn_base' && (
                    <IconButton
                      onClick={() => setOutflows(prev => prev.filter(o => o.id !== item.id))}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-negative-600 transition-opacity shrink-0"
                      title="Delete line"
                    >
                      <Trash2 size={13} />
                    </IconButton>
                  )}
                </div>

                {monthKeys.map(m => {
                  const own = item.monthlyAmounts?.[m];
                  const val = own ?? 0;
                  const adj = item.monthlyAdjustments?.[m] ?? 0;
                  const total = outflowAmount(item, m, runningCosts.total);
                  return (
                    <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 p-2 flex items-center justify-end gap-2">
                      {isLinked ? (
                        <span className="font-semibold text-ink-700 dark:text-ink-300" title="From Team resources + Overheads">-{fmt(runningCosts.total)}</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-negative-500 font-bold">-</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={own === undefined ? '' : val}
                            onChange={e => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              handleUpdateOutflowMonth(item.id, m, raw === '' ? null : parseInt(raw));
                            }}
                            placeholder={String(item.defaultMonthlyAmount ?? 0)}
                            title={item.defaultMonthlyAmount ? (own === undefined ? `Repeated every-month amount. Type a value to change just this month.` : `Clear to go back to the every-month amount (${item.defaultMonthlyAmount.toLocaleString()}).`) : undefined}
                            className="w-24 px-2 py-1 text-right font-bold border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder:text-ink-500 dark:placeholder:text-ink-400 placeholder:font-medium rounded outline-none focus:border-accent-500 text-xs"
                          />
                        </div>
                      )}
                      {showAdjust && (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={adj ? (adj > 0 ? `+${adj}` : String(adj)) : ''}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9+-]/g, '');
                            const sign = raw.trim().startsWith('-') ? -1 : 1;
                            const digits = raw.replace(/[^0-9]/g, '');
                            handleUpdateAdjustment(item.id, m, digits ? sign * parseInt(digits) : 0);
                          }}
                          placeholder="± adjust"
                          title="Correction for this month only: +2000 for extra costs, -1500 for lower costs."
                          aria-label={`${item.name}: adjustment for ${formatMonthLabel(m)}`}
                          className={`w-20 px-2 py-1 text-right text-xs font-semibold border rounded outline-none focus:border-accent-500 bg-white dark:bg-ink-900 placeholder:text-ink-500 dark:placeholder:text-ink-400 placeholder:font-normal ${
                            adj > 0 ? 'border-negative-300 dark:border-negative-800 text-negative-700 dark:text-negative-400'
                            : adj < 0 ? 'border-positive-300 dark:border-positive-800 text-positive-700 dark:text-positive-400'
                            : 'border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300'
                          }`}
                        />
                      )}
                      {showAdjust && adj !== 0 && (
                        <span className="font-bold text-negative-600 dark:text-negative-400 tabular-nums" title="This month's total">= -{fmt(total)}</span>
                      )}
                    </div>
                  );
                })}
                <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums p-2 flex items-center justify-end font-bold text-negative-600 dark:text-negative-400">
                  {(() => { const t = sumVisible(m => outflowAmount(item, m, runningCosts.total)); return t ? `-${fmt(t)}` : <span className="text-ink-500 dark:text-ink-400 font-medium">0</span>; })()}
                </div>
              </div>
              );
            })}
              </React.Fragment>
            ))}
          </div>

          {/* Outflow Subtotal */}
          <div className="bg-ink-50/70 dark:bg-ink-950/80 border-t border-ink-200 dark:border-ink-800 flex font-bold text-xs">
            <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} p-3 text-ink-700 dark:text-ink-300 border-r-2 border-ink-200 dark:border-ink-700`}>
              Total outflows
            </div>
            {monthKeys.map(m => {
              const outTotal = monthlyStats[m]?.totalOutflows || 0;
              return (
                <div key={m} className="w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 py-2.5 px-3 text-right text-negative-600 dark:text-negative-400">
                  -{fmt(outTotal)}
                </div>
              );
            })}
            <div className="w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums py-2.5 px-3 text-right text-negative-600 dark:text-negative-400">-{fmt(sumVisible(m => monthlyStats[m]?.totalOutflows || 0))}</div>
          </div>

          {/* Net Cash & Closing Bank Runway Footer */}
          <div className="bg-ink-50 dark:bg-ink-950 border-t-2 border-ink-200 dark:border-ink-800 text-xs">
            {/* Monthly Net Delta */}
            <div className="flex items-center font-bold">
              <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} p-3.5 border-r-2 border-ink-200 dark:border-ink-700 text-ink-800 dark:text-ink-200`}>
                Net cash flow (collections − outflows)
              </div>
              {monthKeys.map(m => {
                const delta = monthlyStats[m]?.netDelta || 0;
                return (
                  <div 
                    key={m} 
                    className={`w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 p-3 text-right text-sm ${
                      delta >= 0 ? 'text-positive-600 dark:text-positive-400' : 'text-negative-600 dark:text-negative-400'
                    }`}
                  >
                    {delta >= 0 ? '+' : ''}{fmt(delta)}
                  </div>
                );
              })}
              {(() => {
                const net = sumVisible(m => monthlyStats[m]?.netDelta || 0);
                return (
                  <div className={`w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums p-3 text-right text-sm ${net >= 0 ? 'text-positive-600 dark:text-positive-400' : 'text-negative-600 dark:text-negative-400'}`} title="Net cash flow over the visible months">
                    {net >= 0 ? '+' : ''}{fmt(net)}
                  </div>
                );
              })()}
            </div>

            {/* Closing Runway in Banks */}
            <div className="flex items-center font-bold bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800">
              <div style={{ width: LABEL_W }} className={`shrink-0 sticky left-0 z-10 bg-ink-50 dark:bg-ink-950 ${FROZEN_EDGE} p-4 border-r-2 border-ink-200 dark:border-ink-700 flex items-center gap-2 text-ink-900 dark:text-ink-100 text-sm`}>
                <Landmark size={16} className="text-accent-600 dark:text-accent-400" />
                <span>Closing bank cash</span>
              </div>
              {monthKeys.map(m => {
                const closing = monthlyStats[m]?.closingCash ?? null;
                const isDeficit = closing !== null && closing < 0;

                return (
                  <div 
                    key={m} 
                    className={`w-[360px] shrink-0 border-r-2 border-ink-200 dark:border-ink-700 last:border-r-0 p-4 text-right text-base font-extrabold ${
                      isDeficit ? 'text-negative-600 dark:text-negative-400 bg-negative-50/40 dark:bg-negative-950/30' : 'text-accent-700 dark:text-accent-300'
                    }`}
                  >
                    {closing === null ? <span className="text-ink-400 dark:text-ink-500 font-semibold" title="Before the opening balance month">—</span> : fmt(closing)}
                    {m === openingMonthKey && startingBankBalance !== 0 && (
                      <div className="mt-0.5 text-[11px] font-medium text-ink-500 dark:text-ink-400" title="Opening bank cash added at the start of this month">
                        {startingBankBalance > 0 ? '+' : '−'}{fmt(Math.abs(startingBankBalance))} opening bank cash
                      </div>
                    )}
                  </div>
                );
              })}
              {(() => {
                const last = monthlyStats[monthKeys[monthKeys.length - 1]]?.closingCash ?? null;
                return (
                  <div className={`w-[360px] shrink-0 bg-ink-100/60 dark:bg-ink-900/70 tabular-nums p-4 text-right text-base font-extrabold ${last !== null && last < 0 ? 'text-negative-600 dark:text-negative-400' : 'text-accent-700 dark:text-accent-300'}`} title="Bank cash at the end of the last visible month">
                    {last === null ? '—' : fmt(last)}
                  </div>
                );
              })()}
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
        defaultGroupId={addRowGroupId}
        groups={groups}
        onCreateGroup={g => setGroups(prev => [...prev, g])}
      />

      <ManageGroupsModal
        isOpen={manageGroupsOpen}
        groups={groups}
        usage={groupUsage}
        onChange={handleGroupsChange}
        onClose={() => setManageGroupsOpen(false)}
      />

      {/* Edit Row Modal */}
      <EditRowModal
        isOpen={!!editingRow}
        row={editingRow}
        groups={groups}
        onCreateGroup={g => setGroups(prev => [...prev, g])}
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
        message={resetRowTarget?.projectId ? `Rebuild "${resetRowTarget?.name}" from its fee proposal? Your manual changes to this row's amounts will be replaced.` : `Clear all amounts in "${resetRowTarget?.name}"?`}
        confirmText="Reset row"
        onConfirm={() => {
          if (resetRowTarget) {
            handleResetSingleRow(resetRowTarget);
          }
        }}
        onCancel={() => setResetRowTarget(null)}
      />

      {/* Sync Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmSyncOpen}
        title="Sync from projects"
        message="Adds a row for each Active or Proposed project that isn't in the forecast yet, with one amount per payment milestone (milestone % of the project fee), placed in the month its phase ends. Active projects go to Invoiced, Proposed ones to Possible. Existing rows aren't changed."
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

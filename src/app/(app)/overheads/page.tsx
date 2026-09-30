
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Building, Plus, Trash2, Info, RefreshCw, CheckCircle2, ChevronDown, ChevronRight, Upload, Download } from 'lucide-react';
import { getTeamMembers, getOverheadsProfile, updateOverheadsProfile, updateTeamMember, getCategories } from '@/lib/firebase/db';
import { TeamMember, OverheadsProfile, OverheadCategory, OverheadItem, TeamCategory } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/auth/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const DEFAULT_CATEGORIES: OverheadCategory[] = [
  { id: 'cat-1', name: 'Consultants & Corp', items: [
    { id: 'item-1-1', name: 'Ada', yearlyCost: 0, isActive: true },
    { id: 'item-1-2', name: 'Auditors HK', yearlyCost: 0, isActive: true },
    { id: 'item-1-3', name: 'Auditors SG', yearlyCost: 0, isActive: true },
    { id: 'item-1-4', name: 'Domenec', yearlyCost: 0, isActive: true },
    { id: 'item-1-5', name: 'Finance', yearlyCost: 0, isActive: true },
    { id: 'item-1-6', name: 'Enkindle', yearlyCost: 0, isActive: true },
    { id: 'item-1-7', name: 'Comp. Sec India', yearlyCost: 0, isActive: true }
  ]},
  { id: 'cat-2', name: 'Marketing & BD', items: [
    { id: 'item-2-1', name: 'Trips Budget', yearlyCost: 0, isActive: true },
    { id: 'item-2-2', name: 'Conferences & Events', yearlyCost: 0, isActive: true }
  ]},
  { id: 'cat-3', name: 'IT & Software', items: [
    { id: 'item-3-1', name: 'Dropbox', yearlyCost: 0, isActive: true },
    { id: 'item-3-2', name: 'Google Workspace', yearlyCost: 0, isActive: true },
    { id: 'item-3-3', name: 'Magnific', yearlyCost: 0, isActive: true },
    { id: 'item-3-4', name: 'Archicad', yearlyCost: 0, isActive: true },
    { id: 'item-3-5', name: 'Rhino', yearlyCost: 0, isActive: true },
    { id: 'item-3-6', name: 'Microsoft', yearlyCost: 0, isActive: true },
    { id: 'item-3-7', name: 'Airtable', yearlyCost: 0, isActive: true },
    { id: 'item-3-8', name: 'Website Hosting', yearlyCost: 0, isActive: true },
    { id: 'item-3-9', name: 'Parallels', yearlyCost: 0, isActive: true },
    { id: 'item-3-10', name: 'Gendo', yearlyCost: 0, isActive: true },
    { id: 'item-3-11', name: 'Speckle', yearlyCost: 0, isActive: true },
    { id: 'item-3-12', name: 'Automation (n8n, Zapier)', yearlyCost: 0, isActive: true },
    { id: 'item-3-13', name: 'MIRO', yearlyCost: 0, isActive: true },
    { id: 'item-3-14', name: 'XERO', yearlyCost: 0, isActive: true },
    { id: 'item-3-15', name: 'Hardware Depreciation', yearlyCost: 0, isActive: true }
  ]},
  { id: 'cat-4', name: 'Office & Others', items: [
    { id: 'item-4-1', name: 'Memberships (ARB, etc)', yearlyCost: 0, isActive: true },
    { id: 'item-4-2', name: 'Office Rent / Expenses', yearlyCost: 0, isActive: true },
    { id: 'item-4-3', name: 'Health Insurance', yearlyCost: 0, isActive: true },
    { id: 'item-4-4', name: 'Business Insurance', yearlyCost: 0, isActive: true }
  ]}
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function OverheadsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [profile, setProfile] = useState<OverheadsProfile | null>(null);
  
  const [yearlyIncomeTarget, setYearlyIncomeTarget] = useState(1000000);
  const [workingHoursPerYear, setWorkingHoursPerYear] = useState(1832);
  const [categories, setCategories] = useState<OverheadCategory[]>(DEFAULT_CATEGORIES);
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [isNonBillableCollapsed, setIsNonBillableCollapsed] = useState(false);
  const [showConsultants, setShowConsultants] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, action: () => void}>({ isOpen: false, title: '', message: '', action: () => {} });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [mems, tCats, prof] = await Promise.all([
          getTeamMembers(),
          getCategories(),
          getOverheadsProfile()
        ]);
        setMembers(mems);
        setTeamCategories(tCats);
        if (prof) {
          setProfile(prof);
          setYearlyIncomeTarget(prof.yearlyIncomeTarget || 1000000);
          setWorkingHoursPerYear(prof.workingHoursPerYear || 1832);
          if (prof.categories && prof.categories.length > 0) {
            setCategories(prof.categories);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const computedStats = useMemo(() => {
    let nonBillableSalaries = 0;
    let billableHoursTotal = 0;
    let totalTeam = members.length;
    let totalMonthlyBase = 0;

    members.forEach(m => {
      const cat = m.category || 'UNCATEGORIZED';
      const categoryName = teamCategories.find(c => c.id === cat)?.name || 'Uncategorized';
      if (!showConsultants && categoryName.toLowerCase().includes('consultant')) {
        return; // skip external consultants from non-billable overheads if hidden
      }

      const pct = (m.nonBillablePercentage || 0) / 100;
      const yearlySalary = (m.salary * 12);
      nonBillableSalaries += yearlySalary * pct;
      billableHoursTotal += workingHoursPerYear * (1 - pct);
      totalMonthlyBase += m.salary;
    });

    let otherExpenses = 0;
    
    const chartData = [
      { name: 'Non-Billable Time', value: nonBillableSalaries }
    ];

    categories.forEach(c => {
      let catTotal = 0;
      c.items.forEach(i => {
        if (i.isActive) {
          otherExpenses += i.yearlyCost;
          catTotal += i.yearlyCost;
        }
      });
      if (catTotal > 0) {
        chartData.push({ name: c.name, value: catTotal });
      }
    });

    const totalOverheadsYearly = nonBillableSalaries + otherExpenses;
    const overheadPercentVsIncome = yearlyIncomeTarget > 0 ? totalOverheadsYearly / yearlyIncomeTarget : 0;
    
    const totalYearlyBaseSalaries = totalMonthlyBase * 12;
    const multiplier = totalYearlyBaseSalaries > 0 ? (totalYearlyBaseSalaries + totalOverheadsYearly) / totalYearlyBaseSalaries : 1;

    return {
      nonBillableSalaries,
      otherExpenses,
      totalOverheadsYearly,
      overheadPercentVsIncome,
      multiplier,
      billableHoursTotal,
      chartData: chartData.filter(d => d.value > 0)
    };
  }, [members, categories, workingHoursPerYear, yearlyIncomeTarget, showConsultants, teamCategories]);

    const handleExpandAll = () => {
    setIsNonBillableCollapsed(false);
    const newCols: Record<string, boolean> = {};
    categories.forEach(c => newCols[c.id] = false);
    setCollapsedCategories(newCols);
  };
  
  const handleCollapseAll = () => {
    setIsNonBillableCollapsed(true);
    const newCols: Record<string, boolean> = {};
    categories.forEach(c => newCols[c.id] = true);
    setCollapsedCategories(newCols);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      const monthlyOverheadTotal = totalYearlyOverhead / 12;
      const overheadPerPerson = members.length > 0 ? monthlyOverheadTotal / members.length : 0;

      await updateOverheadsProfile({
        yearlyIncomeTarget,
        workingHoursPerYear,
        categories,
        calculatedOverheadPerPerson: overheadPerPerson
      });
      const prof = await getOverheadsProfile();
      setProfile(prof);
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const performSync = async () => {
    setSyncing(true);
    try {
      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      const monthlyOverheadTotal = totalYearlyOverhead / 12;
      const activeMembers = members.filter(m => !m.isOverheadsManuallyOverridden);
      
      if (activeMembers.length > 0) {
        const overheadPerPerson = monthlyOverheadTotal / members.length;
        
        await Promise.all(activeMembers.map(m => {
          const baseCost = (m.salary + Math.round(overheadPerPerson)) / 160;
          return updateTeamMember(m.id!, { overheads: Math.round(overheadPerPerson), costPerHour: baseCost });
        }));
        const mems = await getTeamMembers();
        setMembers(mems);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Successfully synced overheads to team' } }));
      }
    } catch(e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Error syncing overheads' } }));
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncToTeam = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Sync Overheads',
      message: 'This will update the overheads for all team members who are not manually overridden. Proceed?',
      action: performSync
    });
  };

  const handleMemberChange = async (id: string, nonBillablePercentage: number) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, nonBillablePercentage } : m));
    await updateTeamMember(id, { nonBillablePercentage });
  };

  const addCategoryItem = (catId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [...c.items, { id: uuidv4(), name: 'New Expense', yearlyCost: 0, isActive: true }]
        };
      }
      return c;
    }));
    // Auto-expand
    setCollapsedCategories(prev => ({ ...prev, [catId]: false }));
  };

  const updateItem = (catId: string, itemId: string, updates: Partial<OverheadItem>) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
        };
      }
      return c;
    }));
  };

  const removeItem = (catId: string, itemId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.filter(i => i.id !== itemId)
        };
      }
      return c;
    }));
  };

  

  const handleExportCSV = () => {
    let csv = "Category,Expense Name,Yearly Cost,Is Active\n";
    categories.forEach(cat => {
      cat.items.forEach(item => {
        csv += `"${cat.name.replace(/"/g, '""')}","${item.name.replace(/"/g, '""')}",${item.yearlyCost},${item.isActive}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'overheads_expenses.csv';
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      const newCats = [...categories];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parse handling quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!match || match.length < 4) continue;
        
        const catName = match[0].replace(/^"|"$/g, '').replace(/""/g, '"');
        const itemName = match[1].replace(/^"|"$/g, '').replace(/""/g, '"');
        const cost = parseFloat(match[2]) || 0;
        const isActive = match[3].toLowerCase() === 'true';

        let targetCat = newCats.find(c => c.name === catName);
        if (!targetCat) {
          targetCat = { id: uuidv4(), name: catName, items: [] };
          newCats.push(targetCat);
        }

        targetCat.items.push({
          id: uuidv4(),
          name: itemName,
          yearlyCost: cost,
          isActive
        });
      }
      
      setCategories(newCats);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="flex flex-col h-full w-full p-8 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <Building size={28} className="text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight">Overheads Calculator</h1>
          </div>
          <div className="flex items-center gap-3">
            
<button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all"
            >
              <Upload size={16} />
              Import CSV
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all"
            >
              <Download size={16} />
              Export
            </button>
            <button 
              onClick={handleSyncToTeam}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? 'Syncing...' : 'Sync to Team'}
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          {/* LEFT: Stats */}
          <div className="lg:col-span-1 h-full overflow-y-auto pr-2 pb-8 custom-scrollbar">
            <div className="space-y-4 lg:mt-[52px]">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Global Metrics</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Target Income</label>
                  <input 
                    type="number" 
                    value={yearlyIncomeTarget}
                    onChange={e => setYearlyIncomeTarget(Number(e.target.value))}
                    className="w-24 bg-transparent text-right outline-none font-bold text-sm"
                  />
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Work Hrs/Yr</label>
                  <input 
                    type="number" 
                    value={workingHoursPerYear}
                    onChange={e => setWorkingHoursPerYear(Number(e.target.value))}
                    className="w-20 bg-transparent text-right outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total/Yr</div>
                  <div className="text-xl font-bold text-rose-500">${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Burn</div>
                  <div className="text-xl font-bold">${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Multiplier</div>
                  <div className="text-xl font-bold text-blue-500">{computedStats.multiplier.toFixed(2)}x</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">% of Income</div>
                  <div className="text-xl font-bold">{(computedStats.overheadPercentVsIncome * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Breakdown</h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computedStats.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {computedStats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {computedStats.chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="font-bold">${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>

            
          </div>

          {/* RIGHT: Data Entry */}
          </div>
          <div className="lg:col-span-3 flex flex-col h-full min-h-0">
            <div className="flex justify-between items-center bg-transparent shrink-0 mb-6">
              <h2 className="text-xl font-bold">Expense Categories</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleExpandAll} className="text-sm text-blue-500 hover:text-blue-600 font-bold px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">Expand All</button>
                <button onClick={handleCollapseAll} className="text-sm text-slate-500 hover:text-slate-600 font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">Collapse All</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 pb-24 space-y-6 custom-scrollbar">
            {/* Non Billable Roster */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <button 
                onClick={() => setIsNonBillableCollapsed(!isNonBillableCollapsed)}
                className="w-full p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isNonBillableCollapsed ? <ChevronRight size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  <h2 className="font-bold text-lg">1. Non-Billable Time (Salaries)</h2>
                </div>
                <div className="text-sm text-slate-500">
                  Total Burden: <strong className="text-slate-800 dark:text-slate-200">${computedStats.nonBillableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>/yr
                </div>
              </button>
              
              {!isNonBillableCollapsed && (
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">Team Member</th>
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">Yearly Salary</th>
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">% Non-Billable</th>
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-right">Burden ($/yr)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        members.reduce((groups, m) => {
                          const cat = m.category || 'UNCATEGORIZED';
                          if (!groups[cat]) groups[cat] = [];
                          groups[cat].push(m);
                          return groups;
                        }, {} as Record<string, TeamMember[]>)
                      )
                      .sort(([catA], [catB]) => {
                        const orderA = teamCategories.find(c => c.id === catA)?.order ?? 99;
                        const orderB = teamCategories.find(c => c.id === catB)?.order ?? 99;
                        return orderA - orderB;
                      })
                      .map(([categoryId, catMembers]) => {
                        const categoryName = teamCategories.find(c => c.id === categoryId)?.name || 'Uncategorized';
                        if (!showConsultants && categoryName.toLowerCase().includes('consultant')) {
                          return null;
                        }
                        return (
                          <React.Fragment key={categoryId}>
                            <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                              <td colSpan={4} className="px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {categoryName}
                              </td>
                            </tr>
                            {catMembers.map(m => {
                              const yearly = m.salary * 12;
                              const pct = m.nonBillablePercentage || 0;
                              const burden = yearly * (pct / 100);
                              return (
                                <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                  <td className="px-4 py-2 text-sm font-medium pl-8">{m.name}</td>
                                  <td className="px-4 py-2 text-sm text-slate-500">${yearly.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="0" max="100" 
                                        value={pct}
                                        onChange={e => handleMemberChange(m.id!, Number(e.target.value))}
                                        className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-500 px-2 py-1 text-sm rounded outline-none"
                                      />
                                      <span className="text-sm font-bold text-slate-500">%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right font-bold text-rose-500/80">${burden.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Other Categories */}
            <div className="flex flex-col space-y-6">
              {categories.map((cat, catIdx) => {
                const catTotal = cat.items.filter(i => i.isActive).reduce((sum, i) => sum + i.yearlyCost, 0);
                const isCollapsed = collapsedCategories[cat.id];
                
                return (
                  <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full">
                    <button 
                      onClick={() => setCollapsedCategories(prev => ({ ...prev, [cat.id]: !isCollapsed }))}
                      className="w-full p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        <h2 className="font-bold text-md">{catIdx + 2}. {cat.name}</h2>
                      </div>
                      <div className="text-sm font-bold text-slate-500">
                        ${catTotal.toLocaleString()}
                      </div>
                    </button>
                    
                    {!isCollapsed && (
                      <div className="p-4 flex-1">
                        {cat.items.length === 0 ? (
                          <div className="text-sm text-slate-400 italic mb-4">No items yet.</div>
                        ) : (
                          <div className="space-y-3 mb-4">
                            
                          <div className="flex items-center gap-3 px-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="w-3"></div>
                            <div className="flex-1 min-w-0 pl-1">Expense</div>
                            <div className="w-20 text-right">Monthly</div>
                            <div className="w-24 text-right pr-6">Yearly Total</div>
                          </div>
                          {cat.items.map(item => (

                              <div key={item.id} className={`flex items-center gap-3 ${!item.isActive ? 'opacity-50' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  checked={item.isActive}
                                  onChange={e => updateItem(cat.id, item.id, { isActive: e.target.checked })}
                                  className="rounded border-slate-300"
                                />
                                <input 
                                  type="text"
                                  value={item.name}
                                  onChange={e => updateItem(cat.id, item.id, { name: e.target.value })}
                                  placeholder="Expense name"
                                  className="flex-1 min-w-0 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400 text-sm">$</span>
                                  <input 
                                    type="number"
                                    value={Math.round((item.yearlyCost || 0) / 12) || ''}
                                    onChange={e => updateItem(cat.id, item.id, { yearlyCost: Number(e.target.value) * 12 })}
                                    className="w-16 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none text-right"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400 text-sm">$</span>
                                  <input 
                                    type="number"
                                    value={item.yearlyCost || ''}
                                    onChange={e => updateItem(cat.id, item.id, { yearlyCost: Number(e.target.value) })}
                                    className="w-20 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm font-bold outline-none text-right text-slate-700 dark:text-slate-200"
                                    placeholder="0"
                                  />
                                </div>
                                <button onClick={() => removeItem(cat.id, item.id)} className="text-slate-400 hover:text-red-500 shrink-0 ml-2">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <button 
                          onClick={() => addCategoryItem(cat.id)}
                          className="flex items-center gap-1 text-sm font-bold text-blue-500 hover:text-blue-600"
                        >
                          <Plus size={14} /> Add Item
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}


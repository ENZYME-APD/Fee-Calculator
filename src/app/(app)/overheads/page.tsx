'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building, Plus, Trash2, Info, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getTeamMembers, getOverheadsProfile, updateOverheadsProfile, updateTeamMember } from '@/lib/firebase/db';
import { TeamMember, OverheadsProfile, OverheadCategory, OverheadItem } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/auth/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from '@/components/ui/Tooltip';

const DEFAULT_CATEGORIES: OverheadCategory[] = [
  { id: 'cat-1', name: 'Consultants & Corp', items: [] },
  { id: 'cat-2', name: 'Marketing & BD', items: [] },
  { id: 'cat-3', name: 'IT & Software', items: [] },
  { id: 'cat-4', name: 'Office & Others', items: [] }
];

export default function OverheadsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [profile, setProfile] = useState<OverheadsProfile | null>(null);
  
  const [yearlyIncomeTarget, setYearlyIncomeTarget] = useState(1000000);
  const [workingHoursPerYear, setWorkingHoursPerYear] = useState(1832);
  const [categories, setCategories] = useState<OverheadCategory[]>(DEFAULT_CATEGORIES);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [mems, prof] = await Promise.all([
          getTeamMembers(),
          getOverheadsProfile()
        ]);
        setMembers(mems);
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
      // reload
      const prof = await getOverheadsProfile();
      setProfile(prof);
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
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

  const computedStats = useMemo(() => {
    let nonBillableSalaries = 0;
    let billableHoursTotal = 0;
    let totalTeam = members.length;
    let totalMonthlyBase = 0;

    members.forEach(m => {
      const pct = (m.nonBillablePercentage || 0) / 100;
      const yearlySalary = (m.salary * 12);
      nonBillableSalaries += yearlySalary * pct;
      billableHoursTotal += workingHoursPerYear * (1 - pct);
      totalMonthlyBase += m.salary;
    });

    let otherExpenses = 0;
    categories.forEach(c => {
      c.items.forEach(i => {
        if (i.isActive) {
          otherExpenses += i.yearlyCost;
        }
      });
    });

    const totalOverheadsYearly = nonBillableSalaries + otherExpenses;
    const overheadPercentVsIncome = yearlyIncomeTarget > 0 ? totalOverheadsYearly / yearlyIncomeTarget : 0;
    
    // Total cost basis for multiplier (Base salaries + Overheads)
    const totalYearlyBaseSalaries = totalMonthlyBase * 12;
    const multiplier = totalYearlyBaseSalaries > 0 ? (totalYearlyBaseSalaries + totalOverheadsYearly) / totalYearlyBaseSalaries : 1;

    return {
      nonBillableSalaries,
      otherExpenses,
      totalOverheadsYearly,
      overheadPercentVsIncome,
      multiplier,
      billableHoursTotal
    };
  }, [members, categories, workingHoursPerYear, yearlyIncomeTarget]);

  const handleSyncToTeam = async () => {
    if (!confirm('This will update the overheads for all team members who are not manually overridden. Proceed?')) return;
    setSyncing(true);
    try {
      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      // We distribute the total overhead evenly per billable hour across the team?
      // Or distribute it equally among everyone?
      // Simple equal distribution for monthly overhead:
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
        alert('Successfully synced calculated overheads to your team!');
      }
    } catch(e) {
      console.error(e);
      alert('Error syncing overheads');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pb-20">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Building size={32} className="text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight">Overheads Calculator</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Summary</h3>
              
              <div className="mb-6">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Yearly Overheads</div>
                <div className="text-3xl font-bold text-rose-500">${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Monthly Burn Rate</div>
                <div className="text-xl font-bold">${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overhead Multiplier</div>
                <div className="text-2xl font-bold text-blue-500">{computedStats.multiplier.toFixed(2)}x</div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">% of Income</div>
                <div className="text-lg font-bold">{(computedStats.overheadPercentVsIncome * 100).toFixed(1)}%</div>
              </div>

              <button 
                onClick={handleSyncToTeam}
                disabled={syncing}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                {syncing ? 'Syncing...' : 'Sync to Team Members'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Global Metrics</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Target Yearly Income</label>
                  <input 
                    type="number" 
                    value={yearlyIncomeTarget}
                    onChange={e => setYearlyIncomeTarget(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Working Hours / Year</label>
                  <input 
                    type="number" 
                    value={workingHoursPerYear}
                    onChange={e => setWorkingHoursPerYear(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Data Entry */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Non Billable Roster */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="font-bold text-lg">1. Non-Billable Time (Salaries)</h2>
                <div className="text-sm text-slate-500">
                  Total Burden: <strong className="text-slate-800 dark:text-slate-200">${computedStats.nonBillableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>/yr
                </div>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                      <th className="p-4 border-b border-slate-100 dark:border-slate-800">Team Member</th>
                      <th className="p-4 border-b border-slate-100 dark:border-slate-800">Yearly Salary</th>
                      <th className="p-4 border-b border-slate-100 dark:border-slate-800">% Non-Billable</th>
                      <th className="p-4 border-b border-slate-100 dark:border-slate-800 text-right">Burden ($/yr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const yearly = m.salary * 12;
                      const pct = m.nonBillablePercentage || 0;
                      const burden = yearly * (pct / 100);
                      return (
                        <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="p-4 font-medium">{m.name}</td>
                          <td className="p-4 text-slate-500">${yearly.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={pct}
                                onChange={e => handleMemberChange(m.id!, Number(e.target.value))}
                                className="w-24"
                              />
                              <span className="text-sm font-bold w-10">{pct}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-rose-500/80">${burden.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat, catIdx) => {
                const catTotal = cat.items.filter(i => i.isActive).reduce((sum, i) => sum + i.yearlyCost, 0);
                return (
                  <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                      <h2 className="font-bold text-md">{catIdx + 2}. {cat.name}</h2>
                      <div className="text-sm font-bold text-slate-500">
                        ${catTotal.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      {cat.items.length === 0 ? (
                        <div className="text-sm text-slate-400 italic mb-4">No items yet.</div>
                      ) : (
                        <div className="space-y-3 mb-4">
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
                                className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-sm">$</span>
                                <input 
                                  type="number"
                                  value={item.yearlyCost || ''}
                                  onChange={e => updateItem(cat.id, item.id, { yearlyCost: Number(e.target.value) })}
                                  className="w-20 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none text-right"
                                />
                              </div>
                              <button onClick={() => removeItem(cat.id, item.id)} className="text-slate-400 hover:text-red-500">
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
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

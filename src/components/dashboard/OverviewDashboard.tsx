"use client";
import React, { useState, useEffect } from 'react';
import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectCosts } from '@/lib/firebase/db';
import { Project, Phase, TeamMember, Allocation, ProjectCost } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/auth/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Folder, CircleDollarSign, TrendingUp, Users } from 'lucide-react';

export function OverviewDashboard() {
  const { dbUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed Stats
  const [kpis, setKpis] = useState({
    pipelineValue: 0,
    activeValue: 0,
    avgMargin: 0
  });
  
  const [scatterData, setScatterData] = useState<any[]>([]);

  useEffect(() => {
    if (!dbUser) return;
    loadData();
  }, [dbUser]);

  const loadData = async () => {
    setLoading(true);
    const ownerId = dbUser?.role !== 'admin' ? dbUser?.uid : undefined;
    
    // Fetch all required data
    const projs = await getProjects(false, ownerId);
    const phases = await getPhases();
    const members = await getTeamMembers();
    const allocations = await getAllocations();
    const costs = await getProjectCosts();
    
    setProjects(projs);

    // Compute KPIs
    let pipeline = 0;
    let active = 0;
    
    const projectStats = projs.map(proj => {
      const projPhases = phases.filter(p => p.projectId === proj.id);
      const phaseIds = projPhases.map(p => p.id);
      const projAllocs = allocations.filter(a => phaseIds.includes(a.phaseId));
      const projCosts = costs.filter(c => c.projectId === proj.id);

      let totalCost = 0;
      projAllocs.forEach(alloc => {
        const member = members.find(m => m.id === alloc.memberId);
        if (member) {
          totalCost += alloc.hours * member.costPerHour;
        }
      });
      projCosts.forEach(c => {
        totalCost += c.quantity * c.unitCost;
      });

      const profitMarginPercent = proj.profitMargin ?? 30;
      const multiplier = 1 + (profitMarginPercent / 100);
      const totalFee = totalCost * multiplier;

      if (proj.status === 'Draft' || proj.status === 'Proposed') {
        pipeline += totalFee;
      } else if (proj.status === 'Active') {
        active += totalFee;
      }

      return {
        id: proj.id,
        name: proj.name,
        ownerId: proj.ownerId,
        totalCost,
        totalFee,
        margin: profitMarginPercent
      };
    });

    const avgMargin = projectStats.length > 0 
      ? projectStats.reduce((sum, p) => sum + p.margin, 0) / projectStats.length 
      : 0;

    setKpis({ pipelineValue: pipeline, activeValue: active, avgMargin });
    setScatterData(projectStats.filter(p => p.totalFee > 0));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Overview Dashboard</h1>
      
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Folder size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Pipeline (Draft/Proposed)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(kpis.pipelineValue)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Active Value</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(kpis.activeValue)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Avg. Margin</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{kpis.avgMargin.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scatter Plot */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Profit Margin vs Fee Size</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis type="number" dataKey="totalFee" name="Total Fee" tickFormatter={(v) => `$${v / 1000}k`} stroke="#64748b" />
                <YAxis type="number" dataKey="margin" name="Margin" unit="%" stroke="#64748b" />
                <ZAxis type="category" dataKey="name" name="Project" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Scatter name="Projects" data={scatterData} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard (If Admin) */}
        {dbUser?.role === 'admin' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Proposal Leaderboard
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {/* Note: since we don't have user display names easily accessible here, we'll group by ownerId and display it */}
              {Object.entries(scatterData.reduce((acc: any, curr) => {
                const owner = curr.ownerId || 'Unassigned';
                if (!acc[owner]) acc[owner] = { name: owner, totalGenerated: 0, projects: 0 };
                acc[owner].totalGenerated += curr.totalFee;
                acc[owner].projects += 1;
                return acc;
              }, {})).map(([ownerId, data]: any) => (
                <div key={ownerId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{data.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{data.projects} projects generated</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600 dark:text-blue-400">{formatCurrency(data.totalGenerated)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

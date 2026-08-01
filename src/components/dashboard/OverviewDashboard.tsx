"use client";
import React, { useState, useEffect } from 'react';
import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectCosts, getUsersByCompany, getAllPayments } from '@/lib/firebase/db';
import { Project, Phase, TeamMember, Allocation, ProjectCost, User } from '@/lib/firebase/schema';
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
  
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [projectColors, setProjectColors] = useState<Record<string, string>>({});
  
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });

  const [users, setUsers] = useState<User[]>([]);

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
    const companyUsers = await getUsersByCompany();
    const payments = await getAllPayments();
    
    setUsers(companyUsers);
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

    // Calculate Timeline
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#14b8a6', '#f43f5e'];
    const pColors: Record<string, string> = {};
    const pNames: string[] = [];
    
    projs.forEach((p, idx) => {
      pColors[p.name] = colors[idx % colors.length];
      pNames.push(p.name);
    });
    setProjectColors(pColors);
    setProjectNames(pNames);

    const tMap: Record<string, any> = {};
    
    payments.forEach(payment => {
      const proj = projs.find(p => p.id === payment.projectId);
      if (!proj) return;
      const stats = projectStats.find(p => p.id === proj.id);
      if (!stats) return;
      
      const paymentValue = (payment.percentage / 100) * stats.totalFee;
      
      const projStart = new Date(proj.startDate || Date.now());
      let paymentDate = new Date(projStart);
      const projPhases = phases.filter(p => p.projectId === proj.id).sort((a,b) => a.order - b.order);
      
      if (payment.phaseId) {
        let weeksToAdd = 0;
        for (const phase of projPhases) {
          weeksToAdd += phase.durationWeeks || 1;
          if (phase.id === payment.phaseId) break;
        }
        paymentDate.setDate(paymentDate.getDate() + (weeksToAdd * 7));
      } else {
        if (payment.order > 1) {
          const totalWeeks = projPhases.reduce((sum, p) => sum + (p.durationWeeks || 1), 0);
          paymentDate.setDate(paymentDate.getDate() + (totalWeeks * 7));
        }
      }
      
      const year = paymentDate.getFullYear();
      const monthStr = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
      const weekOfMonth = Math.ceil(paymentDate.getDate() / 7);
      
      const bucketKey = `${year}-${monthStr}-W${weekOfMonth}`;
      const shortMonth = paymentDate.toLocaleString('default', { month: 'short' });
      const bucketLabel = `${shortMonth} W${weekOfMonth} '${year.toString().slice(2)}`;
      
      if (!tMap[bucketKey]) {
        tMap[bucketKey] = { bucketKey, label: bucketLabel, dateValue: paymentDate.getTime() };
      }
      if (!tMap[bucketKey][proj.name]) {
        tMap[bucketKey][proj.name] = 0;
      }
      tMap[bucketKey][proj.name] += paymentValue;
    });

    const tArr = Object.values(tMap).sort((a: any, b: any) => a.dateValue - b.dateValue);
    setTimelineData(tArr);

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

      {/* Projected Fee Income Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Projected Fee Income</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">From:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">To:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          {(() => {
            const startMs = new Date(startDate).getTime();
            const endMs = new Date(endDate).getTime();
            const filteredData = timelineData.filter(d => d.dateValue >= startMs && d.dateValue <= endMs);
            
            if (filteredData.length === 0) {
              return (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 italic">
                  No projected payments in this timeframe.
                </div>
              );
            }
            
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: 'var(--tw-prose-bg, #fff)' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {projectNames.map(name => (
                    <Bar key={name} dataKey={name} stackId="a" fill={projectColors[name]} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
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
                <XAxis type="number" dataKey="totalFee" name="Total Fee" tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} stroke="#64748b" />
                <YAxis type="number" dataKey="margin" name="Margin" unit="%" stroke="#64748b" />
                <ZAxis type="category" dataKey="name" name="Project" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: any) => {
                    if (name === "Total Fee") return formatCurrency(Number(value));
                    if (name === "Margin") return `${Number(value).toFixed(1)}%`;
                    return value;
                  }}
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
                const owner = curr.ownerId;
                const ownerUser = users.find(u => u.uid === owner);
                const ownerName = ownerUser?.displayName || ownerUser?.email || 'Unassigned';
                if (!acc[ownerName]) acc[ownerName] = { name: ownerName, totalGenerated: 0, projects: 0 };
                acc[ownerName].totalGenerated += curr.totalFee;
                acc[ownerName].projects += 1;
                return acc;
              }, {})).map(([ownerName, data]: any) => (
                <div key={ownerName as string} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
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

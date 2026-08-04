"use client";
import React, { useState, useEffect } from 'react';
import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectCosts, getUsersByCompany, getAllPayments, getCategories } from '@/lib/firebase/db';
import { Project, Phase, TeamMember, Allocation, ProjectCost, User } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/auth/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, ReferenceLine, LineChart, Line } from 'recharts';
import { Tooltip } from '@/components/ui/Tooltip';
import { Folder, CircleDollarSign, TrendingUp, Users, PieChart as PieChartIcon, List } from 'lucide-react';

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
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [monthlyInvoiceData, setMonthlyInvoiceData] = useState<any[]>([]);
  const [cashflowView, setCashflowView] = useState<'bar' | 'line'>('bar');
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);  const [projectNames, setProjectNames] = useState<string[]>([]);
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
  const [leaderboardView, setLeaderboardView] = useState<'list' | 'chart'>('chart');

  const setRange = (months: number) => {
    const d = new Date();
    d.setDate(1);
    setStartDate(d.toISOString().split('T')[0]);
    d.setMonth(d.getMonth() + months);
    setEndDate(d.toISOString().split('T')[0]);
  };

  const getLocalTime = (dateString: string) => {
    if (!dateString) return 0;
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/50 dark:border-slate-800/50 p-3 rounded-xl shadow-xl min-w-[140px]">
          {label && <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>}
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300 font-medium truncate max-w-[150px]">{entry.name}:</span>
                <span className="text-white font-bold ml-auto pl-2">
                  {formatter ? formatter(entry.value, entry.name) : entry.value}
                </span>
              </div>
            ))}
            {payload.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">Total:</span>
                <span className="text-white font-bold">
                  {formatter ? formatter(payload.reduce((sum: number, p: any) => sum + p.value, 0)) : payload.reduce((sum: number, p: any) => sum + p.value, 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomAxisTick = (dataArray: any[]) => (props: any) => {
    const { x, y, payload } = props;
    if (!payload || payload.index === undefined) return null;
    const data = dataArray[payload.index];
    if (!data) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        {data.showMonth && (
          <text x={0} y={0} dy={12} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">
            {data.monthYearStr}
          </text>
        )}
        <text x={0} y={0} dy={26} textAnchor="middle" fill="#64748b" fontSize={10}>
          {data.weekStr}
        </text>
      </g>
    );
  };

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/50 dark:border-slate-800/50 p-3 rounded-xl shadow-xl min-w-[140px]">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{data.name}</p>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 font-medium">Total Fee:</span>
              <span className="text-white font-bold">{formatCurrency(data.totalFee)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 font-medium">Margin:</span>
              <span className="text-white font-bold">{data.margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!dbUser) return;
    loadData();
  }, [dbUser]);

  const loadData = async () => {
    setLoading(true);
    const ownerId = dbUser?.role !== 'admin' ? dbUser?.uid : undefined;
    
    // Fetch all required data
    const allProjs = await getProjects(false, ownerId);
    const projs = allProjs.filter(p => p.status === 'Proposed' || p.status === 'Active');
    const phases = await getPhases();
    const members = await getTeamMembers();
    const allocations = await getAllocations();
    const costs = await getProjectCosts();
    const companyUsers = await getUsersByCompany();
    const payments = await getAllPayments();
    const categories = await getCategories();
    
    setUsers(companyUsers);
    setProjects(projs);
    setTeamMembers(members);

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
    const mMap: Record<string, any> = {};
    
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
      
      const monthYearKey = `${year}-${monthStr}`;
      const longMonth = paymentDate.toLocaleString('default', { month: 'long' });
      const monthLabel = `${longMonth} ${year}`;
      
      if (!mMap[monthYearKey]) {
        mMap[monthYearKey] = {
          bucketKey: monthYearKey,
          label: monthLabel,
          dateValue: new Date(year, paymentDate.getMonth(), 1).getTime(),
          totalValue: 0,
          projectExpenses: 0,
          teamExpenses: 0,
          totalExpenses: 0,
          netProfit: 0
        };
      }
      mMap[monthYearKey].totalValue += paymentValue;
    });

    const minDate = Math.min(...Object.values(tMap).map((t: any) => t.dateValue), Date.now() - 31536000000); // 1 year ago min
    const maxDate = Math.max(...Object.values(tMap).map((t: any) => t.dateValue), Date.now() + 31536000000); // 1 year from now max
    
    let curr = new Date(minDate);
    const oMap: Record<string, any> = {};
    
    // Prefill all months for mMap and weeks for oMap/tMap
    while (curr.getTime() <= maxDate) {
      const year = curr.getFullYear();
      const monthStr = (curr.getMonth() + 1).toString().padStart(2, '0');
      const weekOfMonth = Math.ceil(curr.getDate() / 7);
      const bucketKey = `${year}-${monthStr}-W${weekOfMonth}`;
      const shortMonth = curr.toLocaleString('default', { month: 'short' });
      
      const monthYearKey = `${year}-${monthStr}`;
      const longMonth = curr.toLocaleString('default', { month: 'long' });
      if (!mMap[monthYearKey]) {
        mMap[monthYearKey] = {
          bucketKey: monthYearKey,
          label: `${longMonth} ${year}`,
          dateValue: new Date(year, curr.getMonth(), 1).getTime(),
          totalValue: 0,
          projectExpenses: 0,
          teamExpenses: 0,
          totalExpenses: 0,
          netProfit: 0
        };
      }
      
      if (!tMap[bucketKey]) {
        tMap[bucketKey] = {
          bucketKey,
          label: `${shortMonth} W${weekOfMonth} '${year.toString().slice(2)}`,
          dateValue: curr.getTime()
        };
      }
      
      if (!oMap[bucketKey]) {
        oMap[bucketKey] = {
          bucketKey,
          label: `${shortMonth} W${weekOfMonth} '${year.toString().slice(2)}`,
          dateValue: curr.getTime()
        };
      }
      
      curr.setDate(curr.getDate() + 7);
    }

    // Calculate Occupancy
    projs.forEach(proj => {
      const projPhases = phases.filter(p => p.projectId === proj.id).sort((a,b) => a.order - b.order);
      
      let currentPhaseStart = new Date(proj.startDate || Date.now());
      
      projPhases.forEach(phase => {
        const duration = phase.durationWeeks || 1;
        const phaseAllocs = allocations.filter(a => a.phaseId === phase.id);
        
        // Calculate Phase end date for expenses
        const phaseEnd = new Date(currentPhaseStart);
        phaseEnd.setDate(phaseEnd.getDate() + (duration * 7));
        const endYear = phaseEnd.getFullYear();
        const endMonthStr = (phaseEnd.getMonth() + 1).toString().padStart(2, '0');
        const endMonthKey = `${endYear}-${endMonthStr}`;
        
        const phaseCosts = costs.filter(c => c.phaseId === phase.id);
        const totalPhaseCost = phaseCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
        
        if (totalPhaseCost > 0 && mMap[endMonthKey]) {
          mMap[endMonthKey].projectExpenses += totalPhaseCost;
        }
        
        for (let w = 0; w < duration; w++) {
          const weekDate = new Date(currentPhaseStart);
          weekDate.setDate(weekDate.getDate() + (w * 7));
          
          const year = weekDate.getFullYear();
          const monthStr = (weekDate.getMonth() + 1).toString().padStart(2, '0');
          const weekOfMonth = Math.ceil(weekDate.getDate() / 7);
          const bucketKey = `${year}-${monthStr}-W${weekOfMonth}`;
          
          if (!oMap[bucketKey]) {
             // In case phase is outside the global min/max dates
             const shortMonth = weekDate.toLocaleString('default', { month: 'short' });
             oMap[bucketKey] = {
               bucketKey,
               label: `${shortMonth} W${weekOfMonth} '${year.toString().slice(2)}`,
               dateValue: weekDate.getTime()
             };
          }
          
          phaseAllocs.forEach(alloc => {
            const hoursPerWeek = alloc.hours / duration;
            const percentPerWeek = (hoursPerWeek / 40) * 100;
            const mid = alloc.memberId;
            
            if (!oMap[bucketKey][mid]) oMap[bucketKey][mid] = { totalPercent: 0 };
            if (!oMap[bucketKey][mid][proj.name]) oMap[bucketKey][mid][proj.name] = 0;
            
            oMap[bucketKey][mid][proj.name] += percentPerWeek;
            oMap[bucketKey][mid].totalPercent += percentPerWeek;
          });
        }
        currentPhaseStart = new Date(phaseEnd);
      });
    });

    const totalMonthlyTeamCost = members.reduce((sum, m) => {
      const cat = categories.find(c => c.id === m.category);
      // Include if it's internal (default is internal, so we only exclude if explicitly 'external')
      if (cat && cat.type === 'external') return sum;
      return sum + (Number(m.salary) || 0) + (Number(m.overheads) || 0);
    }, 0);
    
    Object.values(mMap).forEach((m: any) => {
      m.teamExpenses = totalMonthlyTeamCost;
      m.totalExpenses = m.teamExpenses + m.projectExpenses;
      m.netProfit = m.totalValue - m.totalExpenses;
    });

    const mArr = Object.values(mMap).sort((a: any, b: any) => a.dateValue - b.dateValue);
    setMonthlyInvoiceData(mArr);

    const tArr = Object.values(tMap).sort((a: any, b: any) => a.dateValue - b.dateValue);
    setTimelineData(tArr);
    
    const oArr = Object.values(oMap).sort((a: any, b: any) => a.dateValue - b.dateValue);
    setOccupancyData(oArr);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const leaderboardData = Object.entries(scatterData.reduce((acc: any, curr) => {
    const owner = curr.ownerId;
    const ownerUser = users.find(u => u.uid === owner);
    const ownerName = ownerUser?.displayName || ownerUser?.email || 'Unassigned';
    if (!acc[ownerName]) acc[ownerName] = { name: ownerName, totalGenerated: 0, projects: 0 };
    acc[ownerName].totalGenerated += curr.totalFee;
    acc[ownerName].projects += 1;
    return acc;
  }, {})).map(([_, data]: any) => data).sort((a: any, b: any) => b.totalGenerated - a.totalGenerated);

  const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Overview Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing data for <strong>Proposed</strong> and <strong>Active</strong> projects only. You can change a project's status in the Projects tab.
        </p>
      </div>
      
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
      
      {/* Global Date Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Timeline Range:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg ml-2">
            <button
              onClick={() => setRange(1)}
              className="px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
            >
              1 Month
            </button>
            <button
              onClick={() => setRange(3)}
              className="px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
            >
              3 Months
            </button>
            <button
              onClick={() => setRange(6)}
              className="px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
            >
              6 Months
            </button>
            <button
              onClick={() => setRange(12)}
              className="px-3 py-1.5 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
            >
              12 Months
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
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

      {/* Projected Fee Income Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Projected Fee Income</h2>
        </div>
        
        <div className="h-[400px] w-full">
          {(() => {
            const startMs = getLocalTime(startDate);
            const endMs = getLocalTime(endDate);
            const filteredDataRaw = timelineData.filter(d => d.dateValue >= startMs && d.dateValue <= endMs);
            
            let lastMonth = '';
            const filteredData = filteredDataRaw.map(d => {
              const parts = d.label.split(' ');
              const monthYear = `${parts[0]} ${parts[2]}`;
              const showMonth = monthYear !== lastMonth;
              if (showMonth) lastMonth = monthYear;
              return { ...d, showMonth, monthYearStr: monthYear, weekStr: parts[1] };
            });
            
            if (filteredData.length === 0) {
              return (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 italic">
                  No projected payments in this timeframe.
                </div>
              );
            }
            
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" interval={0} height={60} tick={renderCustomAxisTick(filteredData)} tickMargin={10} />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} 
                    content={<CustomTooltip formatter={(value: any) => formatCurrency(Number(value))} />}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#64748b' }} />
                  {projectNames.map(name => (
                    <Bar key={name} dataKey={name} stackId="a" fill={projectColors[name]} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* Monthly Invoice Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Monthly Projected Invoices</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {(() => {
            const startMs = getLocalTime(startDate);
            const endMs = getLocalTime(endDate);
            const filteredMonths = monthlyInvoiceData.filter(m => m.dateValue >= startMs && m.dateValue <= endMs);
            
            if (filteredMonths.length === 0) {
              return <div className="text-sm text-slate-500 italic">No invoices in this timeframe.</div>;
            }
            return filteredMonths.map(m => (
              <div key={m.bucketKey} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 min-w-[160px] shadow-sm flex flex-col gap-1 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(m.totalValue)}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Monthly Cashflow Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Monthly Cashflow</h2>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setCashflowView('bar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${cashflowView === 'bar' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              Income vs Expenses
            </button>
            <button
              onClick={() => setCashflowView('line')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${cashflowView === 'line' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              Net Profit
            </button>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          {(() => {
            const startMs = getLocalTime(startDate);
            const endMs = getLocalTime(endDate);
            const filteredMonths = monthlyInvoiceData.filter(m => m.dateValue >= startMs && m.dateValue <= endMs);
            
            if (filteredMonths.length === 0) {
              return <div className="w-full h-full flex items-center justify-center text-slate-400">No data.</div>;
            }

            if (cashflowView === 'line') {
               return (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredMonths} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis dataKey="label" stroke="#64748b" tickMargin={10} />
                      <YAxis stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl min-w-[160px]">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-2">{label}</p>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-300 font-medium text-xs">Net Profit:</span>
                                  <span className={`font-bold text-xs ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(data.netProfit)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={0} stroke="#64748b" />
                      <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
               );
            }
            
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMonths} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tickMargin={10} />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl min-w-[200px]">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-3 border-b border-slate-800 pb-2">{label}</p>
                            <div className="flex flex-col gap-2 text-xs">
                              <div className="flex justify-between gap-4">
                                <span className="text-emerald-400 font-bold">Income:</span>
                                <span className="text-white font-bold">{formatCurrency(data.totalValue)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-red-400 font-bold">Total Expenses:</span>
                                <span className="text-white font-bold">{formatCurrency(data.totalExpenses)}</span>
                              </div>
                              <div className="pl-4 flex flex-col gap-1 border-l-2 border-slate-800 mt-1 mb-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Team Salaries:</span>
                                  <span className="text-slate-300">{formatCurrency(data.teamExpenses)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Phase Costs:</span>
                                  <span className="text-slate-300">{formatCurrency(data.projectExpenses)}</span>
                                </div>
                              </div>
                              <div className="flex justify-between gap-4 pt-2 border-t border-slate-800">
                                <span className="text-slate-300 font-bold">Net Profit:</span>
                                <span className={`font-bold ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(data.netProfit)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#64748b' }} />
                  <Bar dataKey="totalValue" name="Invoiced Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="teamExpenses" name="Team Salaries" stackId="expenses" fill="#f43f5e" />
                  <Bar dataKey="projectExpenses" name="Project Expenses" stackId="expenses" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* Team Occupancy Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Team Occupancy</h2>
        </div>
        
        {(() => {
          const startMs = getLocalTime(startDate);
          const endMs = getLocalTime(endDate);
          const filteredWeeks = occupancyData.filter(d => d.dateValue >= startMs && d.dateValue <= endMs);
          
          if (filteredWeeks.length === 0) {
            return <div className="w-full h-40 flex items-center justify-center text-slate-400">No data.</div>;
          }

          const getInitials = (name: string) => {
            if (!name) return '?';
            const parts = name.split(' ').filter(Boolean);
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          };
          
          return (
            <div className="w-full overflow-x-auto pt-8 pb-12 hide-scrollbar -mt-8">
              <div className="inline-block min-w-full align-middle">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200 dark:border-slate-800 text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm py-3 px-4 text-left font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-xl">
                          Team Member
                        </th>
                        {filteredWeeks.map((week, idx) => {
                          const overAllocated = Object.keys(week)
                            .filter(k => !['bucketKey', 'label', 'dateValue'].includes(k))
                            .filter(mid => week[mid].totalPercent > 100)
                            .map(mid => ({ member: teamMembers.find(m => m.id === mid), percent: week[mid].totalPercent }));
                            
                          const parts = week.label.split(' ');
                          const monthStr = parts[0];
                          const weekStr = parts[1];
                          
                          return (
                            <th key={week.bucketKey} className={`py-2 px-3 text-center border-b border-slate-200 dark:border-slate-800 min-w-[120px] ${idx === filteredWeeks.length - 1 ? 'rounded-tr-xl' : ''}`}>
                              <div className="flex flex-col items-center gap-1 group relative">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{monthStr}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-700 dark:text-slate-200">{weekStr}</span>
                                  {overAllocated.length > 0 && (
                                    <div className="relative cursor-help z-50">
                                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl border border-slate-700">
                                        <p className="font-bold mb-1 text-red-400 border-b border-slate-700 pb-1 uppercase tracking-wider">Over-allocated:</p>
                                        {overAllocated.map((oa, i) => (
                                          <div key={i} className="flex justify-between gap-4 my-1">
                                            <span>{oa.member?.name || 'Unknown'}</span>
                                            <span className="font-mono text-red-300">{oa.percent.toFixed(0)}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                      {teamMembers.map((member, memberIdx) => {
                        return (
                          <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className={`sticky left-0 z-10 bg-white dark:bg-slate-950/95 backdrop-blur-sm py-3 px-4 text-left border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] max-w-[200px] ${memberIdx === teamMembers.length - 1 ? 'rounded-bl-xl' : ''}`}>
                              <Tooltip content={member.name} wrapper="div" className="truncate font-bold text-slate-800 dark:text-slate-200 w-full">
                                {member.name}
                              </Tooltip>
                            </td>
                            {filteredWeeks.map((week, idx) => {
                              const allocs: { projectName: string, percent: number }[] = [];
                              const memberData = week[member.id!];
                              if (memberData) {
                                Object.keys(memberData).forEach(k => {
                                  if (k !== 'totalPercent' && memberData[k] > 0) {
                                    allocs.push({ projectName: k, percent: memberData[k] });
                                  }
                                });
                              }
                              
                              if (allocs.length === 0) {
                                return <td key={`${member.id}-${week.bucketKey}`} className={`py-2 px-2 border-r border-slate-100 dark:border-slate-900/30 ${memberIdx === teamMembers.length - 1 && idx === filteredWeeks.length - 1 ? 'rounded-br-xl' : ''}`}></td>;
                              }
                              
                              const isOver = memberData?.totalPercent > 100;
                              
                              return (
                                <td key={`${member.id}-${week.bucketKey}`} className={`py-2 px-2 align-middle border-r border-slate-100 dark:border-slate-900/30 ${memberIdx === teamMembers.length - 1 && idx === filteredWeeks.length - 1 ? 'rounded-br-xl' : ''}`}>
                                  <div className="flex flex-wrap gap-1.5 justify-center">
                                    {allocs.map((alloc, i) => {
                                      return (
                                        <Tooltip key={i} content={`${alloc.projectName}\nResource: ${member.name}\nProject: ${alloc.percent.toFixed(0)}%\nTotal Weekly: ${memberData?.totalPercent.toFixed(0)}%`} wrapper="div" className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border transition-colors cursor-default ${isOver ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 hover:bg-red-200 dark:hover:bg-red-900/50' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                          <span className="max-w-[80px] truncate">{alloc.projectName}</span>
                                          <span className={`text-[10px] ${isOver ? 'opacity-80' : 'opacity-50'}`}>{alloc.percent.toFixed(0)}%</span>
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
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
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3', stroke: 'rgba(148, 163, 184, 0.4)' }} 
                  animationDuration={150}
                  content={<CustomScatterTooltip />}
                />
                <Scatter name="Projects" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={projectColors[entry.name] || '#3b82f6'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard (If Admin) */}
        {dbUser?.role === 'admin' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                Proposal Leaderboard
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setLeaderboardView('list')}
                  className={`p-1.5 rounded-md transition-colors ${leaderboardView === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <List size={16} />
                </button>
                <button 
                  onClick={() => setLeaderboardView('chart')}
                  className={`p-1.5 rounded-md transition-colors ${leaderboardView === 'chart' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <PieChartIcon size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {leaderboardView === 'list' ? (
                leaderboardData.map((data: any) => (
                  <div key={data.name as string} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{data.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{data.projects} projects generated</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-blue-600 dark:text-blue-400">{formatCurrency(data.totalGenerated)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full w-full min-h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaderboardData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="totalGenerated"
                        nameKey="name"
                      >
                        {leaderboardData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        animationDuration={150}
                        content={<CustomTooltip formatter={(value: any) => formatCurrency(Number(value))} />}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

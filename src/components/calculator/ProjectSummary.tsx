"use client";
import React, { useState, useEffect } from 'react';
import { Project, Phase, Allocation, TeamMember, ProjectCost, TeamCategory } from '@/lib/firebase/schema';
import { updateProject, getCategories } from '@/lib/firebase/db';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Calculator, Edit3, Check, X, Download } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface ProjectSummaryProps {
  project: Project;
  phases: Phase[];
  allocations: Allocation[];
  members: TeamMember[];
  projectCosts?: ProjectCost[];
  onProjectUpdated: () => void;
  onClose: () => void;
}

export function ProjectSummary({ project, phases, allocations, members, projectCosts = [], onProjectUpdated, onClose }: ProjectSummaryProps) {
  const { formatCurrency, areaUnit } = useAppSettings();
  const [isEditingMargin, setIsEditingMargin] = useState(false);
  const [marginInput, setMarginInput] = useState(project.profitMargin?.toString() || '30');
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [areaInput, setAreaInput] = useState(project.area?.toString() || '0');
  const [categories, setCategories] = useState<TeamCategory[]>([]);

  useEffect(() => {
    getCategories().then(c => setCategories(c.sort((a, b) => a.order - b.order)));
  }, []);

  // Compute stats per phase
  const phaseStats = phases.map(phase => {
    const phaseAllocations = allocations.filter(a => a.phaseId === phase.id);
    let totalHours = 0;
    let totalCost = 0;

    const breakdown: Record<string, number> = {};
    let otherExpenses = 0;

    phaseAllocations.forEach(alloc => {
      const member = members.find(m => m.id === alloc.memberId);
      if (member) {
        totalHours += alloc.hours;
        const cost = alloc.hours * member.costPerHour;
        totalCost += cost;

        const catId = member.category || 'uncategorized';
        breakdown[catId] = (breakdown[catId] || 0) + cost;
      }
    });

    const phaseCosts = projectCosts.filter(c => c.phaseId === phase.id);
    const addedCost = phaseCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
    totalCost += addedCost;
    
    phaseCosts.forEach(c => {
      const cost = c.quantity * c.unitCost;
      otherExpenses += cost;
    });

    return {
      phase,
      totalHours,
      totalCost,
      breakdown,
      otherExpenses
    };
  });

  const profitMarginPercent = project.profitMargin ?? 30; // Default 30% if not set
  const multiplier = 1 + (profitMarginPercent / 100);

  const projectTotalCost = phaseStats.reduce((sum, stat) => sum + stat.totalCost, 0);
  const projectTotalFee = projectTotalCost * multiplier;
  const projectTotalWeeks = phases.reduce((sum, phase) => sum + phase.durationWeeks, 0);
  
  const handleSaveMargin = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(marginInput) || 0;
    await updateProject(project.id!, { profitMargin: val });
    setIsEditingMargin(false);
    onProjectUpdated();
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(areaInput) || 0;
    await updateProject(project.id!, { area: val });
    setIsEditingArea(false);
    onProjectUpdated();
  };

  const handleExportCSV = () => {
    const rows = [
      ['PROJECT SUMMARY', project.name.toUpperCase()],
      ['Profit Margin', `${profitMarginPercent}%`],
      [],
      ['COST SUMMARY'],
      ['Phase', 'Cost', 'Multiplier', 'Fee Proposal']
    ];

    phaseStats.forEach(stat => {
      const feeProposal = stat.totalCost * multiplier;
      rows.push([
        stat.phase.name,
        formatCurrency(stat.totalCost),
        multiplier.toFixed(2),
        formatCurrency(feeProposal)
      ]);
    });

    rows.push([]);
    rows.push(['Total Cost', formatCurrency(projectTotalCost)]);
    rows.push(['Total Weeks', projectTotalWeeks.toString()]);
    rows.push(['Avg Cost / Month', formatCurrency(projectTotalCost / (projectTotalWeeks / 4 || 1))]);
    if (project.area && project.area > 0) {
      rows.push([`Avg Cost / ${areaUnit}`, formatCurrency(projectTotalCost / project.area)]);
    }
    rows.push([]);
    
    rows.push(['FEE STRUCTURE']);
    rows.push(['Phase', '% of Total', 'Fee Proposal']);
    
    phaseStats.forEach(stat => {
      const feeAmount = stat.totalCost * multiplier;
      const percent = projectTotalFee > 0 ? (feeAmount / projectTotalFee) * 100 : 0;
      rows.push([
        stat.phase.name,
        `${percent.toFixed(2)}%`,
        formatCurrency(feeAmount)
      ]);
    });

    rows.push([]);
    rows.push(['FINAL FEE', '', formatCurrency(projectTotalFee)]);

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${project.name.replace(/\s+/g, '_')}_Financial_Summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const element = document.getElementById('project-summary-content');
    if (!element) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const headHtml = document.head.innerHTML;
    
    doc.write(`
      <html>
        <head>
          ${headHtml}
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
            }
          </style>
        </head>
        <body class="p-8 bg-white text-slate-900">
          <div style="max-width: 1200px; margin: 0 auto;">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-7xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 dark:bg-slate-900 text-white shrink-0 border-b border-slate-700 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Calculator size={20} className="text-blue-400" />
            <h3 className="font-bold tracking-wider text-lg">PROJECT SUMMARY & FEE STRUCTURE</h3>
            <span className="text-sm font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 ml-4 hidden sm:inline-block">
              Total Fee: {formatCurrency(projectTotalFee)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
              <Download size={16} />
              <span>Export PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-700 transition-colors ml-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex gap-6 flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
        
        {/* Cost Summary Table */}
        <div className="flex-[1.2] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col rounded-xl" id="project-summary-content">
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-4 py-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">COST SUMMARY</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Project Area ({areaUnit})</span>
                {isEditingArea ? (
                  <form onSubmit={handleSaveArea} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input 
                      type="number" 
                      value={areaInput} 
                      onChange={e => setAreaInput(e.target.value)}
                      className="w-20 px-2 py-0.5 text-sm border border-slate-300 dark:border-slate-600 rounded text-right font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button type="submit" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 p-1"><Check size={16} /></button>
                  </form>
                ) : (
                  <div 
                    className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setIsEditingArea(true); setAreaInput(project.area?.toString() || '0'); }}
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{project.area || 0}</span>
                    <Edit3 size={12} className="text-slate-400 dark:text-slate-500" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Profit Margin</span>
              {isEditingMargin ? (
                <form onSubmit={handleSaveMargin} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={marginInput} 
                    onChange={e => setMarginInput(e.target.value)}
                    className="w-16 px-2 py-0.5 text-sm border border-slate-300 dark:border-slate-600 rounded text-right font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">%</span>
                  <button type="submit" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 p-1"><Check size={16} /></button>
                </form>
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setIsEditingMargin(true); setMarginInput(profitMarginPercent.toString()); }}
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{profitMarginPercent}%</span>
                  <Edit3 size={12} className="text-slate-400 dark:text-slate-500" />
                </div>
              )}
              </div>
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-bold border-r border-slate-200 dark:border-slate-700">PHASE</th>
                  <th className="px-4 py-2.5 font-bold text-right border-r border-slate-200 dark:border-slate-700">COST</th>
                  <th className="px-4 py-2.5 font-bold text-center border-r border-slate-200 dark:border-slate-700">MULTIPLIER</th>
                  <th className="px-4 py-2.5 font-bold text-right">FEE PROPOSAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {phaseStats.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">No phases added.</td></tr>
                ) : (
                  phaseStats.map(stat => {
                    const feeProposal = stat.totalCost * multiplier;
                    return (
                      <tr key={stat.phase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{stat.phase.name}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">{formatCurrency(stat.totalCost)}</td>
                        <td className="px-4 py-2 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">{multiplier.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-200">{formatCurrency(feeProposal)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Cost Footer */}
          <div className="bg-emerald-500 text-white font-bold p-3 text-sm grid grid-cols-2 gap-4 border-t border-slate-300 dark:border-slate-700">
            <div>
              <div className="flex justify-between py-1">
                <span>Total Cost</span>
                <span>{formatCurrency(projectTotalCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-emerald-400">
                <span>Total Weeks</span>
                <span>{projectTotalWeeks}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-emerald-400">
                <span>Avg Cost / Month</span>
                <span>{formatCurrency(projectTotalCost / (projectTotalWeeks / 4 || 1))}</span>
              </div>
              {(project.area || 0) > 0 && (
                <div className="flex justify-between py-1 border-t border-emerald-400">
                  <span>Avg Cost / {areaUnit}</span>
                  <span>{formatCurrency(projectTotalCost / project.area!)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="text-right">
                <div className="text-emerald-100 text-xs">FINAL FEE</div>
                <div className="text-2xl">{formatCurrency(projectTotalFee)}</div>
                {(project.area || 0) > 0 && (
                  <div className="text-emerald-100 text-xs mt-1 border-t border-emerald-400/50 pt-1">
                    {formatCurrency(projectTotalFee / project.area!)} / {areaUnit}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fee Structure Table */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col rounded-xl">
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-4 py-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">FEE STRUCTURE</h4>
            <span className="font-bold text-blue-700 dark:text-blue-900 bg-yellow-300 px-2 py-0.5 rounded shadow-sm text-sm border border-yellow-400">
              {formatCurrency(projectTotalFee)}
            </span>
          </div>
          
          <div className="overflow-auto flex-1 p-3">
            <div className="space-y-2">
              {phaseStats.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 py-6 text-sm">No phases to structure.</div>
              ) : (
                phaseStats.map((stat, i) => {
                  const feeAmount = stat.totalCost * multiplier;
                  const percent = projectTotalFee > 0 ? (feeAmount / projectTotalFee) * 100 : 0;
                  
                  // Compute breakdown percentages (relative to phase total cost)
                  const total = stat.totalCost || 1;

                  // Generate alternating pastel colors like the image
                  const colors = ['bg-green-200 border-green-300', 'bg-blue-200 border-blue-300', 'bg-pink-200 border-pink-300', 'bg-purple-200 border-purple-300', 'bg-yellow-200 border-yellow-300'];
                  const colorClass = colors[i % colors.length];
                  
                  const darkColors = ['dark:bg-green-900/50 dark:border-green-800', 'dark:bg-blue-900/50 dark:border-blue-800', 'dark:bg-pink-900/50 dark:border-pink-800', 'dark:bg-purple-900/50 dark:border-purple-800', 'dark:bg-yellow-900/50 dark:border-yellow-800'];
                  const darkColorClass = darkColors[i % darkColors.length];

                  return (
                    <div key={stat.phase.id} className="flex flex-col text-sm border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
                      <div className="flex">
                        <div className="flex-1 px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950">
                          {stat.phase.name}
                        </div>
                        <div className={`w-24 px-3 py-2 text-right font-medium text-slate-800 dark:text-slate-200 border-l ${colorClass} ${darkColorClass}`}>
                          {percent.toFixed(2)}%
                        </div>
                        <div className={`w-36 px-3 py-2 text-right font-bold text-slate-900 dark:text-white border-l ${colorClass} ${darkColorClass}`}>
                          {formatCurrency(feeAmount)}
                        </div>
                      </div>
                      
                      {/* Breakdown Bar */}
                      <div className="h-4 w-full flex bg-slate-100 dark:bg-slate-800">
                        {categories.map((cat, idx) => {
                          const cost = stat.breakdown[cat.id!] || 0;
                          if (cost === 0) return null;
                          const percent = (cost / total) * 100;
                          const bgColor = cat.color || '#3b82f6';
                          return <Tooltip key={cat.id} content={`${cat.name}: ${percent.toFixed(1)}%`} className="transition-all hover:opacity-90 h-full" style={{width: `${percent}%`, backgroundColor: bgColor}} children={<></>} />
                        })}
                        {(stat.breakdown['uncategorized'] || 0) > 0 && (
                          <Tooltip content={`Uncategorized: ${(((stat.breakdown['uncategorized'] || 0) / total) * 100).toFixed(1)}%`} className="bg-slate-400 transition-all hover:opacity-90 h-full" style={{width: `${((stat.breakdown['uncategorized'] || 0) / total) * 100}%`}} children={<></>} />
                        )}
                        {stat.otherExpenses > 0 && (
                          <Tooltip content={`Other Expenses: ${((stat.otherExpenses / total) * 100).toFixed(1)}%`} className="transition-all hover:opacity-90 h-full" style={{width: `${(stat.otherExpenses / total) * 100}%`, backgroundColor: categories.find(c => c.isFixed)?.color || '#fb923c'}} children={<></>} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Legend moved to bottom */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {categories.map((cat, idx) => {
                if (cat.isFixed) return null;
                const bgColor = cat.color || '#3b82f6';
                return (
                  <div key={cat.id} className="flex items-center gap-1 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: bgColor}}></div>{cat.name}</div>
                );
              })}
              <div className="flex items-center gap-1 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-sm bg-slate-400"></div>Uncategorized</div>
              <div className="flex items-center gap-1 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: categories.find(c => c.isFixed)?.color || '#fb923c'}}></div>Other Expenses</div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

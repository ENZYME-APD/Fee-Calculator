"use client";
import React, { useState, useEffect } from 'react';
import { hasFixedFee, effectiveMarginPercent, feeMultiplierFor } from '@/lib/utils/projectFinancials';
import { Project, Phase, Allocation, TeamMember, ProjectCost, TeamCategory, Payment } from '@/lib/firebase/schema';
import { updateProject, getCategories, updatePayment } from '@/lib/firebase/db';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Calculator, Edit3, Check, X, Download } from 'lucide-react';
import { InlinePercentInput } from '@/components/projects/PaymentScheduleManager';
import { Tooltip } from '@/components/ui/Tooltip';
import { getAllocationRate } from '@/lib/utils/allocationCost';

import { DEFAULT_CATEGORY_HEX, tc } from '@/lib/theme';
interface ProjectSummaryProps {
  project: Project;
  phases: Phase[];
  allocations: Allocation[];
  members: TeamMember[];
  projectCosts?: ProjectCost[];
  payments?: Payment[];
  onProjectUpdated: () => void;
  onPaymentUpdated?: () => void;
  onClose: () => void;
}

export function ProjectSummary({ project, phases, allocations, members, projectCosts = [], payments = [], onProjectUpdated, onPaymentUpdated, onClose }: ProjectSummaryProps) {
  const { formatCurrency, areaUnit } = useAppSettings();
  const [isEditingMargin, setIsEditingMargin] = useState(false);
  const [marginInput, setMarginInput] = useState(project.profitMargin?.toString() || '30');
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [areaInput, setAreaInput] = useState(project.area?.toString() || '0');
  const [categories, setCategories] = useState<TeamCategory[]>([]);

  const saveMargin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let margin = parseFloat(marginInput);
    if (isNaN(margin)) margin = 0;
    
    if (project.id) {
      await updateProject(project.id, { profitMargin: margin });
      onProjectUpdated();
    }
    setIsEditingMargin(false);
  };

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
      // Time booked by someone who has since left still counts, at the rate saved on the
      // allocation, so an issued proposal's fee doesn't change when the team does (same as
      // the payment schedule and computeProjectFinancials).
      const member = members.find(m => m.id === alloc.memberId);
      totalHours += alloc.hours;
      const cost = alloc.hours * getAllocationRate(alloc, member);
      totalCost += cost;

      const catId = member?.category || 'uncategorized';
      breakdown[catId] = (breakdown[catId] || 0) + cost;
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

  const projectTotalCost = phaseStats.reduce((sum, stat) => sum + stat.totalCost, 0);
  // With a fixed fee the margin is worked out from it and can't be typed here
  const isFixed = hasFixedFee(project);
  const profitMarginPercent = effectiveMarginPercent(project, projectTotalCost);
  const multiplier = feeMultiplierFor(project, projectTotalCost);
  const projectTotalFee = isFixed ? project.fixedFee! : projectTotalCost * multiplier;
  
  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);
  const projectTotalWeeks = phases.reduce((sum, phase) => sum + phase.durationWeeks, 0);
  
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
        <body class="p-8 bg-white text-ink-900">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 bg-ink-900/60 backdrop-blur-sm">
      <div className="bg-ink-50 dark:bg-ink-950 w-full max-w-7xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-ink-800 dark:bg-ink-900 text-white shrink-0 border-b border-ink-700 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <Calculator size={20} className="text-accent-400" />
            <h3 className="font-semibold text-lg">{project.name} — Summary & payment schedule</h3>
            <span className="text-sm font-bold bg-positive-500/20 text-positive-400 px-3 py-1 rounded-full border border-positive-500/30 ml-4 hidden sm:inline-block">
              Total Fee: {formatCurrency(projectTotalFee)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-accent-600/20 text-accent-400 border border-accent-500/30 hover:bg-accent-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-negative-600/20 text-negative-400 border border-negative-500/30 hover:bg-negative-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
              <Download size={16} />
              <span>Export PDF</span>
            </button>
            <button onClick={onClose} className="text-ink-500 hover:text-white p-1.5 rounded-full hover:bg-ink-700 transition-colors ml-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex gap-6 flex-col lg:flex-row bg-ink-50 dark:bg-ink-950">
        
        {/* Cost Summary Table */}
        <div className="flex-[1.2] bg-white dark:bg-ink-900 border border-ink-300 dark:border-ink-700 shadow-sm overflow-hidden flex flex-col rounded-xl" id="project-summary-content">
          <div className="flex justify-between items-center bg-ink-100 dark:bg-ink-800 border-b border-ink-300 dark:border-ink-700 px-4 py-2">
            <h4 className="font-bold text-ink-800 dark:text-ink-200 text-sm">Cost summary</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Project area ({areaUnit})</span>
                <div className="flex items-center gap-2 bg-white dark:bg-ink-900 px-2 py-0.5 rounded border border-ink-200 dark:border-ink-700">
                  <span className="font-bold text-ink-800 dark:text-ink-200 text-sm">{project.area || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Profit margin</span>
                {isEditingMargin ? (
                  <form onSubmit={saveMargin} className="flex items-center gap-1">
                  <input 
                    type="number" 
                    step="0.1" 
                    value={marginInput} 
                    onChange={e => setMarginInput(e.target.value)}
                    className="w-16 px-1.5 py-0.5 text-sm border border-ink-300 dark:border-ink-600 rounded text-right font-bold text-ink-800 dark:text-ink-200 bg-ink-50 dark:bg-ink-800 focus:outline-none focus:border-accent-500"
                    autoFocus
                    onBlur={() => saveMargin()}
                  />
                  <span className="text-sm font-bold text-ink-600 dark:text-ink-400">%</span>
                </form>
                ) : (
                  <button onClick={() => { if (isFixed) return; setMarginInput(profitMarginPercent.toString()); setIsEditingMargin(true); }} title={isFixed ? 'Calculated from the fixed fee. Turn off Fixed fee in the header to type a margin.' : undefined} className="flex items-center gap-2 bg-white dark:bg-ink-900 px-2 py-0.5 rounded border border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600 transition-colors group">
                    <span className="font-bold text-ink-800 dark:text-ink-200 text-sm">{profitMarginPercent}%</span>
                    <Edit3 size={12} className="text-ink-500 group-hover:text-ink-600 dark:group-hover:text-ink-300" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-ink-50 dark:bg-ink-950 text-ink-600 dark:text-ink-400 border-b border-ink-200 dark:border-ink-700">
                <tr>
                  <th className="px-4 py-2.5 font-bold border-r border-ink-200 dark:border-ink-700">PHASE</th>
                  <th className="px-4 py-2.5 font-bold text-right border-r border-ink-200 dark:border-ink-700">COST</th>
                  <th className="px-4 py-2.5 font-bold text-center border-r border-ink-200 dark:border-ink-700">MULTIPLIER</th>
                  <th className="px-4 py-2.5 font-bold text-right">FEE PROPOSAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {phaseStats.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-500 dark:text-ink-400">No phases added.</td></tr>
                ) : (
                  phaseStats.map(stat => {
                    const feeProposal = stat.totalCost * multiplier;
                    return (
                      <tr key={stat.phase.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                        <td className="px-4 py-2 font-semibold text-ink-700 dark:text-ink-300 border-r border-ink-200 dark:border-ink-700">{stat.phase.name}</td>
                        <td className="px-4 py-2 text-right font-medium text-ink-600 dark:text-ink-400 border-r border-ink-200 dark:border-ink-700">{formatCurrency(stat.totalCost)}</td>
                        <td className="px-4 py-2 text-center text-ink-500 dark:text-ink-400 border-r border-ink-200 dark:border-ink-700">{multiplier.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-bold text-ink-800 dark:text-ink-200">{formatCurrency(feeProposal)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Cost Footer */}
          <div className="bg-positive-500 text-white font-bold p-3 text-sm grid grid-cols-2 gap-4 border-t border-ink-300 dark:border-ink-700">
            <div>
              <div className="flex justify-between py-1">
                <span>Total cost</span>
                <span>{formatCurrency(projectTotalCost)}</span>
              </div>
              <div className="flex justify-between items-center text-positive-100/90 text-sm py-1 border-t border-positive-400">
                <span>Profit margin</span>
                {isEditingMargin ? (
                  <form onSubmit={saveMargin} className="flex items-center">
                    <input
                      type="number"
                      autoFocus
                      value={marginInput}
                      onChange={e => setMarginInput(e.target.value)}
                      onBlur={() => saveMargin()}
                      className="w-16 px-1 py-0.5 text-right text-sm font-bold text-ink-900 rounded focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                    />
                    <span className="text-sm font-bold ml-1 text-positive-100">%</span>
                  </form>
                ) : (
                  <button onClick={() => { if (isFixed) return; setMarginInput(profitMarginPercent.toString()); setIsEditingMargin(true); }} title={isFixed ? 'Calculated from the fixed fee. Turn off Fixed fee in the header to type a margin.' : undefined} className="flex items-center gap-1 hover:text-white transition-colors group">
                    <span>{profitMarginPercent}%</span>
                    <Edit3 size={12} className="opacity-50 group-hover:opacity-100" />
                  </button>
                )}
              </div>
              <div className="flex justify-between py-1 border-t border-positive-400">
                <span>Total weeks</span>
                <span>{projectTotalWeeks}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-positive-400">
                <span>Avg cost / month</span>
                <span>{formatCurrency(projectTotalCost / (projectTotalWeeks / 4 || 1))}</span>
              </div>
              {(project.area || 0) > 0 && (
                <div className="flex justify-between py-1 border-t border-positive-400">
                  <span>Avg cost / {areaUnit}</span>
                  <span>{formatCurrency(projectTotalCost / project.area!)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="text-right">
                <div className="text-positive-100 text-xs">Final fee</div>
                <div className="text-2xl">{formatCurrency(projectTotalFee)}</div>
                {(project.area || 0) > 0 && (
                  <div className="text-positive-100 text-xs mt-1 border-t border-positive-400/50 pt-1">
                    {formatCurrency(projectTotalFee / project.area!)} / {areaUnit}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Schedule Table */}
        <div className="flex-1 bg-white dark:bg-ink-900 border border-ink-300 dark:border-ink-700 shadow-sm overflow-hidden flex flex-col rounded-xl">
          <div className="flex justify-between items-center bg-ink-100 dark:bg-ink-800 border-b border-ink-300 dark:border-ink-700 px-4 py-2">
            <h4 className="font-bold text-ink-800 dark:text-ink-200 text-sm">PAYMENT SCHEDULE</h4>
            <span className="font-bold text-accent-700 dark:text-accent-900 bg-warning-300 px-2 py-0.5 rounded shadow-sm text-sm border border-warning-400">
              {formatCurrency(projectTotalFee)}
            </span>
          </div>
          
          <div className="overflow-auto flex-1 p-3">
            <div className="space-y-2">
              {payments.length === 0 ? (
                <div className="text-center text-ink-500 dark:text-ink-400 py-6 text-sm">No payment schedule defined.</div>
              ) : (
                payments.sort((a, b) => a.order - b.order).map((payment, i) => {
                  const feeAmount = (projectTotalFee * payment.percentage) / 100;
                  
                  // Find associated phase stats if any
                  const linkedPhaseStat = phaseStats.find(s => s.phase.id === payment.phaseId);
                  const total = linkedPhaseStat?.totalCost || 1;

                  // Generate alternating pastel colors like the image
                  const colors = ['bg-positive-200 border-positive-300', 'bg-accent-200 border-accent-300', 'bg-clay-200 border-clay-300', 'bg-info-200 border-info-300', 'bg-warning-200 border-warning-300'];
                  const colorClass = colors[i % colors.length];
                  
                  const darkColors = ['dark:bg-positive-900/50 dark:border-positive-800', 'dark:bg-accent-900/50 dark:border-accent-800', 'dark:bg-clay-900/50 dark:border-clay-800', 'dark:bg-info-900/50 dark:border-info-800', 'dark:bg-warning-900/50 dark:border-warning-800'];
                  const darkColorClass = darkColors[i % darkColors.length];

                  return (
                    <div key={payment.id} className="flex flex-col text-sm border border-ink-200 dark:border-ink-700 rounded overflow-hidden">
                      <div className="flex">
                        <div className="flex-1 px-3 py-2 font-semibold text-ink-700 dark:text-ink-300 bg-ink-50 dark:bg-ink-950 flex flex-col justify-center">
                          <div>{payment.name}</div>
                          {linkedPhaseStat && (
                            <div className="text-xs text-accent-600 dark:text-accent-400 font-medium mt-0.5">
                              Phase: {linkedPhaseStat.phase.name}
                            </div>
                          )}
                        </div>
                        <div className={`w-28 px-3 py-2 flex items-center justify-end font-medium text-ink-800 dark:text-ink-200 border-l ${colorClass} ${darkColorClass}`}>
                          <InlinePercentInput 
                            value={payment.percentage} 
                            maxAllowed={100 - (totalPercentage - payment.percentage)}
                            onChange={async (newVal) => {
                              if (payment.id) {
                                await updatePayment(payment.id, { percentage: newVal });
                                if (onPaymentUpdated) onPaymentUpdated();
                              }
                            }} 
                          />
                        </div>
                        <div className={`w-36 px-3 py-2 flex items-center justify-end text-right font-bold text-ink-900 dark:text-ink-50 border-l ${colorClass} ${darkColorClass}`}>
                          {formatCurrency(feeAmount)}
                        </div>
                      </div>
                      
                      {/* Breakdown Bar if linked to phase */}
                      {linkedPhaseStat && (
                        <div className="h-4 w-full flex bg-ink-100 dark:bg-ink-800">
                          {categories.map((cat, idx) => {
                            const cost = linkedPhaseStat.breakdown[cat.id!] || 0;
                            if (cost === 0) return null;
                            const percent = (cost / total) * 100;
                            const bgColor = cat.color || DEFAULT_CATEGORY_HEX;
                            return <Tooltip key={cat.id} content={`${cat.name}: ${percent.toFixed(1)}%`} className="transition-all hover:opacity-90 h-full" style={{width: `${percent}%`, backgroundColor: bgColor}} children={<></>} />
                          })}
                          {(linkedPhaseStat.breakdown['uncategorized'] || 0) > 0 && (
                            <Tooltip content={`Uncategorized: ${(((linkedPhaseStat.breakdown['uncategorized'] || 0) / total) * 100).toFixed(1)}%`} className="bg-ink-400 transition-all hover:opacity-90 h-full" style={{width: `${((linkedPhaseStat.breakdown['uncategorized'] || 0) / total) * 100}%`}} children={<></>} />
                          )}
                          {linkedPhaseStat.otherExpenses > 0 && (
                            <Tooltip content={`Other Expenses: ${((linkedPhaseStat.otherExpenses / total) * 100).toFixed(1)}%`} className="transition-all hover:opacity-90 h-full" style={{width: `${(linkedPhaseStat.otherExpenses / total) * 100}%`, backgroundColor: categories.find(c => c.isFixed)?.color || tc('warning', 400)}} children={<></>} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Legend moved to bottom */}
          <div className="p-3 bg-ink-50 dark:bg-ink-800/50 border-t border-ink-200 dark:border-ink-700">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-medium text-ink-500 dark:text-ink-400">
              {categories.map((cat, idx) => {
                if (cat.isFixed) return null;
                const bgColor = cat.color || DEFAULT_CATEGORY_HEX;
                return (
                  <div key={cat.id} className="flex items-center gap-1 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: bgColor}}></div>{cat.name}</div>
                );
              })}
              <div className="flex items-center gap-1 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-sm bg-ink-400"></div>Uncategorized</div>
              <div className="flex items-center gap-1 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: categories.find(c => c.isFixed)?.color || tc('warning', 400)}}></div>Other expenses</div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

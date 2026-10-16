"use client";
import React from 'react';
import { hasFixedFee, effectiveMarginPercent, feeMultiplierFor } from '@/lib/utils/projectFinancials';
import { Project, Phase, Allocation, TeamMember, ProjectCost, Payment } from '@/lib/firebase/schema';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { FileSpreadsheet, X, Download } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { getAllocationRate } from '@/lib/utils/allocationCost';

interface PaymentScheduleModalProps {
  project: Project;
  phases: Phase[];
  allocations: Allocation[];
  members: TeamMember[];
  projectCosts?: ProjectCost[];
  payments: Payment[];
  onClose: () => void;
}

export function PaymentScheduleModal({ project, phases, allocations, members, projectCosts = [], payments, onClose }: PaymentScheduleModalProps) {
  const { formatCurrency } = useAppSettings();
  // Compute Total Fee
  const phaseStats = phases.map(phase => {
    const phaseAllocations = allocations.filter(a => a.phaseId === phase.id);
    let totalCost = 0;
    phaseAllocations.forEach(alloc => {
      const member = members.find(m => m.id === alloc.memberId);
      totalCost += alloc.hours * getAllocationRate(alloc, member);
    });
    const phaseCosts = projectCosts.filter(c => c.phaseId === phase.id);
    const addedCost = phaseCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
    totalCost += addedCost;
    return totalCost;
  });

  const projectTotalCost = phaseStats.reduce((sum, cost) => sum + cost, 0);
  const profitMarginPercent = effectiveMarginPercent(project, projectTotalCost);
  const multiplier = feeMultiplierFor(project, projectTotalCost);
  const projectTotalFee = hasFixedFee(project) ? project.fixedFee! : projectTotalCost * multiplier;

  const sortedPhases = [...phases].sort((a,b) => a.order - b.order);
  const sortedPayments = [...payments].sort((a, b) => a.order - b.order);
  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);

  // Color Helpers
  const getPhaseColor = (index: number) => {
    const colors = [
      { pastel: 'bg-positive-100 border-positive-300 text-positive-800 dark:bg-positive-900/30 dark:border-positive-700 dark:text-positive-300', bright: 'bg-positive-500 border-positive-600 text-white dark:bg-positive-600 dark:border-positive-500' },
      { pastel: 'bg-accent-100 border-accent-300 text-accent-800 dark:bg-accent-900/30 dark:border-accent-700 dark:text-accent-300', bright: 'bg-accent-500 border-accent-600 text-white dark:bg-accent-600 dark:border-accent-500' },
      { pastel: 'bg-clay-100 border-clay-300 text-clay-800 dark:bg-clay-900/30 dark:border-clay-700 dark:text-clay-300', bright: 'bg-clay-500 border-clay-600 text-white dark:bg-clay-600 dark:border-clay-500' },
      { pastel: 'bg-info-100 border-info-300 text-info-800 dark:bg-info-900/30 dark:border-info-700 dark:text-info-300', bright: 'bg-info-500 border-info-600 text-white dark:bg-info-600 dark:border-info-500' },
      { pastel: 'bg-warning-100 border-warning-300 text-warning-800 dark:bg-warning-900/30 dark:border-warning-700 dark:text-warning-300', bright: 'bg-warning-500 border-warning-600 text-white dark:bg-warning-600 dark:border-warning-500' }
    ];
    return colors[index % colors.length];
  };
  const unlinkedColor = { pastel: 'bg-ink-100 border-ink-300 text-ink-800 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-300', bright: 'bg-ink-400 border-ink-500 text-white dark:bg-ink-600 dark:border-ink-500' };

  // Timeline Data Grouping
  const unlinkedPayments = sortedPayments.filter(p => !p.phaseId);
  // Assume order <= 1 is start (Mobilisation), else end (Final)
  const startPayments = unlinkedPayments.filter(p => p.order <= 1);
  const endPayments = unlinkedPayments.filter(p => p.order > 1);

  const handleExportCSV = () => {
    const rows = [
      ['PAYMENT SCHEDULE', project.name.toUpperCase()],
      ['Total Project Fee', formatCurrency(projectTotalFee)],
      [],
      ['Order', 'Payment Stage', 'Phase Link', '% Value', 'Fee Amount']
    ];

    sortedPayments.forEach((payment, index) => {
      const linkedPhase = phases.find(p => p.id === payment.phaseId);
      const feeAmount = (payment.percentage / 100) * projectTotalFee;
      rows.push([
        (index + 1).toString(),
        payment.name,
        linkedPhase ? linkedPhase.name : '-',
        `${payment.percentage}%`,
        formatCurrency(feeAmount)
      ]);
    });

    rows.push([]);
    rows.push(['Total', '', '', `${totalPercentage}%`, formatCurrency((totalPercentage / 100) * projectTotalFee)]);

    const csvContent = rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${project.name.replace(/\s+/g, '_')}_Payment_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const element = document.getElementById('payment-schedule-content');
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
      <div className="bg-ink-50 dark:bg-ink-950 w-full max-w-6xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-ink-800 dark:bg-ink-900 text-white shrink-0 border-b border-ink-700 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-positive-400" />
            <h3 className="font-bold tracking-wider text-lg">PAYMENT SCHEDULE</h3>
            <span className="text-sm font-bold bg-accent-500/20 text-accent-400 px-3 py-1 rounded-full border border-accent-500/30 ml-4 hidden sm:inline-block">
              Total Fee: {formatCurrency(projectTotalFee)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-positive-600/20 text-positive-400 border border-positive-500/30 hover:bg-positive-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
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
        <div className="flex-1 overflow-y-auto bg-ink-50/50 dark:bg-ink-950/50">
          <div className="max-w-5xl mx-auto p-8" id="payment-schedule-content">
          
          {/* TIMELINE DIAGRAM */}
          <div className="bg-white dark:bg-ink-900 border border-ink-300 dark:border-ink-700 shadow-sm flex flex-col rounded-xl overflow-hidden mb-6">
            <div className="flex justify-between items-center bg-ink-100 dark:bg-ink-800 border-b border-ink-300 dark:border-ink-700 px-4 py-2">
              <h4 className="font-bold text-ink-800 dark:text-ink-200 text-sm">SCHEDULE TIMELINE</h4>
            </div>
            
            <div className="p-4 w-full flex gap-1">
              {/* Start Payments */}
              {startPayments.length > 0 && (
                <div className="flex flex-col gap-2 pr-2 mr-1 border-r-2 border-dashed border-ink-200 dark:border-ink-700 shrink-0">
                  <div className="h-10"></div> {/* Header spacer aligned to new h-10 headers */}
                  <div className="flex-1 flex flex-col gap-1 justify-center pb-1">
                    {startPayments.map(p => (
                      <Tooltip key={p.id} content={p.name} wrapper="div" className={`w-16 border rounded p-1.5 flex flex-col items-center justify-center shadow-sm ${unlinkedColor.pastel}`}>
                        <span className="text-[10px] font-bold">{p.percentage}%</span>
                        <span className="text-[9px] font-medium truncate w-full text-center mt-0.5">{p.name}</span>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Phases and Weeks */}
              <div className="flex-1 flex gap-1 min-w-0">
                {sortedPhases.map((phase, pIndex) => {
                  const phaseColors = getPhaseColor(pIndex);
                  const phasePayments = sortedPayments.filter(p => p.phaseId === phase.id);
                  const weeks = Math.max(1, Math.ceil(phase.durationWeeks));
                  
                  return (
                    <div key={phase.id} className={`flex flex-col border rounded-lg overflow-hidden shadow-sm shrink-0 ${phaseColors.pastel}`} style={{ flex: Math.max(1, phase.durationWeeks) }}>
                      <Tooltip content={phase.name} wrapper="div" className={`h-10 text-[10px] font-bold px-1 py-0.5 text-center border-b leading-tight flex items-center justify-center break-words ${phaseColors.pastel}`}>
                        {phase.name}
                      </Tooltip>
                      <div className="flex flex-1">
                        {Array.from({ length: weeks }).map((_, wIndex) => {
                          const weekNum = wIndex + 1;
                          // Distribute payments across the available weeks
                          const paymentsThisWeek = phasePayments.filter((p, pIdx) => {
                            const expectedWeek = Math.max(1, Math.round(weeks * ((pIdx + 1) / phasePayments.length)));
                            return expectedWeek === weekNum;
                          });

                          return (
                            <div key={weekNum} className="flex-1 flex flex-col items-center border-r border-black/10 dark:border-white/10 last:border-r-0 min-h-[48px] p-0.5 pb-1">
                              <span className="text-[8px] font-medium opacity-50 mb-1">W{weekNum}</span>
                              <div className="mt-auto flex flex-col justify-end gap-0.5 w-full">
                                {paymentsThisWeek.map(p => (
                                  <Tooltip key={p.id} content={`${p.name} - ${formatCurrency((p.percentage / 100) * projectTotalFee, 0)}`} wrapper="div" className={`w-full border rounded py-0.5 px-0.5 flex flex-col items-center shadow-sm cursor-help transition-transform hover:scale-110 ${phaseColors.bright}`}>
                                    <span className="text-[9px] font-extrabold leading-none">{p.percentage}%</span>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* End Payments */}
              {endPayments.length > 0 && (
                <div className="flex flex-col gap-2 pl-2 ml-1 border-l-2 border-dashed border-ink-200 dark:border-ink-700 shrink-0">
                  <div className="h-10"></div> {/* Header spacer aligned to new h-10 headers */}
                  <div className="flex-1 flex flex-col gap-1 justify-center pb-1">
                    {endPayments.map(p => (
                      <Tooltip key={p.id} content={p.name} wrapper="div" className={`w-16 border rounded p-1.5 flex flex-col items-center justify-center shadow-sm ${unlinkedColor.pastel}`}>
                        <span className="text-[10px] font-bold">{p.percentage}%</span>
                        <span className="text-[9px] font-medium truncate w-full text-center mt-0.5">{p.name}</span>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-ink-900 border border-ink-300 dark:border-ink-700 shadow-sm overflow-hidden flex flex-col rounded-xl">
            <div className="flex justify-between items-center bg-ink-100 dark:bg-ink-800 border-b border-ink-300 dark:border-ink-700 px-4 py-2">
              <h4 className="font-bold text-ink-800 dark:text-ink-200 text-sm">Schedule summary</h4>
              <span className={`text-sm font-bold px-2 py-0.5 rounded shadow-sm border ${totalPercentage === 100 ? 'bg-positive-100 text-positive-700 border-positive-200' : 'bg-warning-100 text-warning-700 border-warning-200'}`}>
                Total Allocated: {totalPercentage}%
              </span>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-ink-50 dark:bg-ink-950 text-ink-600 dark:text-ink-400 border-b border-ink-200 dark:border-ink-700">
                  <tr>
                    <th className="px-4 py-3 font-bold w-12 text-center">#</th>
                    <th className="px-4 py-3 font-bold border-x border-ink-200 dark:border-ink-700">PAYMENT STAGE</th>
                    <th className="px-4 py-3 font-bold border-r border-ink-200 dark:border-ink-700 text-center">% VALUE</th>
                    <th className="px-4 py-3 font-bold text-right text-accent-600 dark:text-accent-400">FEE AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {sortedPayments.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-500 dark:text-ink-400">No payments scheduled. Go to Projects & Phases to create them.</td></tr>
                  ) : (
                    sortedPayments.map((payment, index) => {
                      const linkedPhase = phases.find(p => p.id === payment.phaseId);
                      const feeAmount = (payment.percentage / 100) * projectTotalFee;
                      const phaseIndex = sortedPhases.findIndex(p => p.id === payment.phaseId);
                      const phaseColors = phaseIndex >= 0 ? getPhaseColor(phaseIndex) : unlinkedColor;

                      return (
                        <tr key={payment.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-ink-500">{index + 1}</td>
                          <td className="px-4 py-3 border-x border-ink-200 dark:border-ink-700">
                            <div className="font-semibold text-ink-700 dark:text-ink-300">{payment.name}</div>
                            {linkedPhase && <div className="text-xs font-medium text-accent-500 mt-0.5">Phase: {linkedPhase.name}</div>}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-ink-200 dark:border-ink-700">
                             <span className={`inline-block w-20 px-2 py-1 text-right font-medium border rounded shadow-sm ${phaseColors.pastel}`}>
                               {payment.percentage.toFixed(2)}%
                             </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-ink-800 dark:text-ink-200 text-base">
                            {formatCurrency(feeAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer */}
            {sortedPayments.length > 0 && (
              <div className="bg-ink-100 dark:bg-ink-800 font-bold p-4 text-sm flex justify-between items-center border-t border-ink-300 dark:border-ink-700">
                <div className="text-ink-500 dark:text-ink-400">Total schedule</div>
                <div className="flex items-center gap-8">
                  <div className={`text-lg ${totalPercentage === 100 ? 'text-positive-600 dark:text-positive-400' : 'text-warning-500 dark:text-warning-400'}`}>
                    {totalPercentage.toFixed(2)}%
                  </div>
                  <div className="text-xl text-accent-700 dark:text-accent-400">
                    {formatCurrency((totalPercentage / 100) * projectTotalFee)}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

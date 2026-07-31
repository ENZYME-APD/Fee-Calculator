"use client";
import React from 'react';
import { Project, Phase, Allocation, TeamMember, ProjectCost, Payment } from '@/lib/firebase/schema';
import { FileSpreadsheet, X, Download } from 'lucide-react';

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
  // Compute Total Fee
  const phaseStats = phases.map(phase => {
    const phaseAllocations = allocations.filter(a => a.phaseId === phase.id);
    let totalCost = 0;
    phaseAllocations.forEach(alloc => {
      const member = members.find(m => m.id === alloc.memberId);
      if (member) {
        totalCost += (alloc.hours * member.costPerHour);
      }
    });
    const phaseCosts = projectCosts.filter(c => c.phaseId === phase.id);
    const addedCost = phaseCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
    totalCost += addedCost;
    return totalCost;
  });

  const projectTotalCost = phaseStats.reduce((sum, cost) => sum + cost, 0);
  const profitMarginPercent = project.profitMargin ?? 30;
  const multiplier = 1 + (profitMarginPercent / 100);
  const projectTotalFee = projectTotalCost * multiplier;

  const sortedPhases = [...phases].sort((a,b) => a.order - b.order);
  const sortedPayments = [...payments].sort((a, b) => a.order - b.order);
  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);

  // Color Helpers
  const getPhaseColor = (index: number) => {
    const colors = [
      { pastel: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300', bright: 'bg-green-500 border-green-600 text-white dark:bg-green-600 dark:border-green-500' },
      { pastel: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300', bright: 'bg-blue-500 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-500' },
      { pastel: 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300', bright: 'bg-pink-500 border-pink-600 text-white dark:bg-pink-600 dark:border-pink-500' },
      { pastel: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300', bright: 'bg-purple-500 border-purple-600 text-white dark:bg-purple-600 dark:border-purple-500' },
      { pastel: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300', bright: 'bg-yellow-500 border-yellow-600 text-white dark:bg-yellow-600 dark:border-yellow-500' }
    ];
    return colors[index % colors.length];
  };
  const unlinkedColor = { pastel: 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300', bright: 'bg-slate-400 border-slate-500 text-white dark:bg-slate-600 dark:border-slate-500' };

  // Timeline Data Grouping
  const unlinkedPayments = sortedPayments.filter(p => !p.phaseId);
  // Assume order <= 1 is start (Mobilisation), else end (Final)
  const startPayments = unlinkedPayments.filter(p => p.order <= 1);
  const endPayments = unlinkedPayments.filter(p => p.order > 1);

  const handleExportCSV = () => {
    const rows = [
      ['PAYMENT SCHEDULE', project.name.toUpperCase()],
      ['Total Project Fee', `$${projectTotalFee.toFixed(2)}`],
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
        `$${feeAmount.toFixed(2)}`
      ]);
    });

    rows.push([]);
    rows.push(['Total', '', '', `${totalPercentage}%`, `$${((totalPercentage / 100) * projectTotalFee).toFixed(2)}`]);

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

  const handleExportPDF = async () => {
    const element = document.getElementById('payment-schedule-content');
    if (!element) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       0.5,
        filename:     `${project.name.replace(/\s+/g, '_')}_Payment_Schedule.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1200 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-6xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 dark:bg-slate-900 text-white shrink-0 border-b border-slate-700 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-emerald-400" />
            <h3 className="font-bold tracking-wider text-lg">PAYMENT SCHEDULE</h3>
            <span className="text-sm font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 ml-4 hidden sm:inline-block">
              Total Fee: ${projectTotalFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
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
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50" id="payment-schedule-content">
          <div className="max-w-5xl mx-auto p-8">
          
          {/* TIMELINE DIAGRAM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col rounded-xl overflow-hidden mb-6">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-4 py-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">SCHEDULE TIMELINE</h4>
            </div>
            
            <div className="p-4 w-full flex gap-1">
              {/* Start Payments */}
              {startPayments.length > 0 && (
                <div className="flex flex-col gap-2 pr-2 mr-1 border-r-2 border-dashed border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="h-10"></div> {/* Header spacer aligned to new h-10 headers */}
                  <div className="flex-1 flex flex-col gap-1 justify-center pb-1">
                    {startPayments.map(p => (
                      <div key={p.id} className={`w-16 border rounded p-1.5 flex flex-col items-center justify-center shadow-sm ${unlinkedColor.pastel}`} title={p.name}>
                        <span className="text-[10px] font-bold">{p.percentage}%</span>
                        <span className="text-[9px] font-medium truncate w-full text-center mt-0.5">{p.name}</span>
                      </div>
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
                      <div className={`h-10 text-[10px] font-bold px-1 py-0.5 text-center border-b leading-tight flex items-center justify-center break-words ${phaseColors.pastel}`} title={phase.name}>
                        <span className="line-clamp-2">{phase.name}</span>
                      </div>
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
                                  <div key={p.id} className={`w-full border rounded py-0.5 px-0.5 flex flex-col items-center shadow-sm cursor-help transition-transform hover:scale-110 ${phaseColors.bright}`} title={`${p.name} - $${((p.percentage / 100) * projectTotalFee).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}>
                                    <span className="text-[9px] font-extrabold leading-none">{p.percentage}%</span>
                                  </div>
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
                <div className="flex flex-col gap-2 pl-2 ml-1 border-l-2 border-dashed border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="h-10"></div> {/* Header spacer aligned to new h-10 headers */}
                  <div className="flex-1 flex flex-col gap-1 justify-center pb-1">
                    {endPayments.map(p => (
                      <div key={p.id} className={`w-16 border rounded p-1.5 flex flex-col items-center justify-center shadow-sm ${unlinkedColor.pastel}`} title={p.name}>
                        <span className="text-[10px] font-bold">{p.percentage}%</span>
                        <span className="text-[9px] font-medium truncate w-full text-center mt-0.5">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col rounded-xl">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-4 py-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">SCHEDULE SUMMARY</h4>
              <span className={`text-sm font-bold px-2 py-0.5 rounded shadow-sm border ${totalPercentage === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                Total Allocated: {totalPercentage}%
              </span>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-bold w-12 text-center">#</th>
                    <th className="px-4 py-3 font-bold border-x border-slate-200 dark:border-slate-700">PAYMENT STAGE</th>
                    <th className="px-4 py-3 font-bold border-r border-slate-200 dark:border-slate-700 text-center">% VALUE</th>
                    <th className="px-4 py-3 font-bold text-right text-blue-600 dark:text-blue-400">FEE AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedPayments.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No payments scheduled. Go to Projects & Phases to create them.</td></tr>
                  ) : (
                    sortedPayments.map((payment, index) => {
                      const linkedPhase = phases.find(p => p.id === payment.phaseId);
                      const feeAmount = (payment.percentage / 100) * projectTotalFee;
                      const phaseIndex = sortedPhases.findIndex(p => p.id === payment.phaseId);
                      const phaseColors = phaseIndex >= 0 ? getPhaseColor(phaseIndex) : unlinkedColor;

                      return (
                        <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3 border-x border-slate-200 dark:border-slate-700">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{payment.name}</div>
                            {linkedPhase && <div className="text-[10px] font-bold text-blue-500 uppercase mt-0.5 tracking-wider">Phase: {linkedPhase.name}</div>}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 dark:border-slate-700">
                             <span className={`inline-block w-20 px-2 py-1 text-right font-medium border rounded shadow-sm ${phaseColors.pastel}`}>
                               {payment.percentage.toFixed(2)}%
                             </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200 text-base">
                            ${feeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div className="bg-slate-100 dark:bg-slate-800 font-bold p-4 text-sm flex justify-between items-center border-t border-slate-300 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Schedule</div>
                <div className="flex items-center gap-8">
                  <div className={`text-lg ${totalPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>
                    {totalPercentage.toFixed(2)}%
                  </div>
                  <div className="text-xl text-blue-700 dark:text-blue-400">
                    ${((totalPercentage / 100) * projectTotalFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

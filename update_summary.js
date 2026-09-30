const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add coreTeamCount and overheadPerPerson to computedStats
const oldComputedStatsReturn = `    return {
      nonBillableSalaries,
      otherExpenses,
      totalOverheadsYearly,
      overheadPercentVsIncome,
      multiplier,
      billableHoursTotal,
      chartData: chartData.filter(d => d.value > 0)
    };`;
const newComputedStatsReturn = `    const coreTeamCount = members.filter(m => teamCategories.find(c => c.id === m.category)?.type !== 'external').length;
    const monthlyOverheadPerPerson = coreTeamCount > 0 ? (totalOverheadsYearly / 12) / coreTeamCount : 0;

    return {
      nonBillableSalaries,
      otherExpenses,
      totalOverheadsYearly,
      overheadPercentVsIncome,
      multiplier,
      billableHoursTotal,
      chartData: chartData.filter(d => d.value > 0),
      coreTeamCount,
      monthlyOverheadPerPerson
    };`;
code = code.replace(oldComputedStatsReturn, newComputedStatsReturn);


// 2. Update Summary Grid layout
const oldSummaryGrid = `              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total/Yr</div>
                  <div className="text-xl font-bold text-rose-500">\${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Burn</div>
                  <div className="text-xl font-bold">\${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Multiplier</div>
                  <div className="text-xl font-bold text-blue-500">{computedStats.multiplier.toFixed(2)}x</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">% of Income</div>
                  <div className="text-xl font-bold">{(computedStats.overheadPercentVsIncome * 100).toFixed(1)}%</div>
                </div>
              </div>`;
const newSummaryGrid = `              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total/Yr</div>
                  <div className="text-xl font-bold text-rose-500">\${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Burn</div>
                  <div className="text-xl font-bold">\${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Multiplier</div>
                  <div className="text-xl font-bold text-blue-500">{computedStats.multiplier.toFixed(2)}x</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">% of Income</div>
                  <div className="text-xl font-bold">{(computedStats.overheadPercentVsIncome * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Core Staff</div>
                  <div className="text-xl font-bold">{computedStats.coreTeamCount}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mthly / Staff</div>
                  <div className="text-xl font-bold text-emerald-500">\${computedStats.monthlyOverheadPerPerson.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>`;
code = code.replace(oldSummaryGrid, newSummaryGrid);

fs.writeFileSync(file, code);

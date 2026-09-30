const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace the entire Summary block with the combined one
const oldSummaryMatch = /<div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">[\s\S]*?<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Summary<\/h3>[\s\S]*?<\/div>/;

const combinedSummaryHtml = `<div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                  <div className="text-xl font-bold text-rose-500">\\\${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Burn</div>
                  <div className="text-xl font-bold">\\\${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
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
            </div>`;

code = code.replace(oldSummaryMatch, combinedSummaryHtml);

// 2. Add toggle for Consultants
if (!code.includes('showConsultants, setShowConsultants')) {
  code = code.replace(
    'const [isNonBillableCollapsed, setIsNonBillableCollapsed] = useState(false);',
    'const [isNonBillableCollapsed, setIsNonBillableCollapsed] = useState(false);\n  const [showConsultants, setShowConsultants] = useState(false);'
  );
}

// 3. Add toggle UI next to the header
const nonBillableHeaderMatch = /<h2 className="font-bold text-lg">1\. Non-Billable Time \(Salaries\)<\/h2>[\s\S]*?<\/button>/;
const nonBillableHeaderReplacement = `<div className="flex items-center gap-3">
                  <h2 className="font-bold text-lg">1. Non-Billable Time (Salaries)</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <label className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded cursor-pointer transition-colors" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={showConsultants}
                      onChange={e => setShowConsultants(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-500"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider">Show Consultants</span>
                  </label>
                  <span>
                    Total Burden: <strong className="text-slate-800 dark:text-slate-200">\\\${computedStats.nonBillableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>/yr
                  </span>
                </div>
              </button>`;

code = code.replace(/<div className="flex items-center gap-3">\s*?{isNonBillableCollapsed \? <ChevronRight[\s\S]*?<h2 className="font-bold text-lg">1\. Non-Billable Time \(Salaries\)<\/h2>\s*?<\/div>\s*?<div className="text-sm text-slate-500">\s*?Total Burden: <strong className="text-slate-800 dark:text-slate-200">\$\S*?<\/strong>\/yr\s*?<\/div>\s*?<\/button>/, function(match) {
  return `<div className="flex items-center gap-3">
                  {isNonBillableCollapsed ? <ChevronRight size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  <h2 className="font-bold text-lg">1. Non-Billable Time (Salaries)</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <label className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded cursor-pointer transition-colors" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={showConsultants}
                      onChange={e => setShowConsultants(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-500"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Show Consultants</span>
                  </label>
                  <span>
                    Total Burden: <strong className="text-slate-800 dark:text-slate-200">\\\${computedStats.nonBillableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>/yr
                  </span>
                </div>
              </button>`;
});

// 4. Update the computedStats to ignore consultants if !showConsultants
const computedStatsOld = `    members.forEach(m => {
      const pct = (m.nonBillablePercentage || 0) / 100;
      const yearlySalary = (m.salary * 12);
      nonBillableSalaries += yearlySalary * pct;
      billableHoursTotal += workingHoursPerYear * (1 - pct);
      totalMonthlyBase += m.salary;
    });`;

const computedStatsNew = `    members.forEach(m => {
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
    });`;

code = code.replace(computedStatsOld, computedStatsNew);

// 5. Update the render loop to ignore consultants
const renderOld = `                      .map(([categoryId, catMembers]) => {
                        const categoryName = teamCategories.find(c => c.id === categoryId)?.name || 'Uncategorized';
                        return (
                          <React.Fragment key={categoryId}>`;

const renderNew = `                      .map(([categoryId, catMembers]) => {
                        const categoryName = teamCategories.find(c => c.id === categoryId)?.name || 'Uncategorized';
                        if (!showConsultants && categoryName.toLowerCase().includes('consultant')) {
                          return null;
                        }
                        return (
                          <React.Fragment key={categoryId}>`;

code = code.replace(renderOld, renderNew);


fs.writeFileSync(file, code);

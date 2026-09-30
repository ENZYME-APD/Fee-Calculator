const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix text-md to text-base in dynamic categories
code = code.replace(/text-md/g, 'text-base');

// 2. Fix Non-Billable header
const oldNonBillableHeader = `<button 
                onClick={() => setIsNonBillableCollapsed(!isNonBillableCollapsed)}
                className="w-full p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isNonBillableCollapsed ? <ChevronRight size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  <h2 className="font-bold text-lg">1. Non-Billable Time (Salaries)</h2>
                </div>
                <div className="text-sm text-slate-500">
                  Total Burden: <strong className="text-slate-800 dark:text-slate-200">\${computedStats.nonBillableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>/yr
                </div>
              </button>`;

const newNonBillableHeader = `<button 
                onClick={() => setIsNonBillableCollapsed(!isNonBillableCollapsed)}
                className={\`w-full p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left \${!isNonBillableCollapsed ? 'border-b border-slate-100 dark:border-slate-800' : ''}\`}
              >
                <div className="flex items-center gap-2">
                  {isNonBillableCollapsed ? <ChevronRight size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  <h2 className="font-bold text-base">1. Non-Billable Time (Salaries)</h2>
                </div>
                <div className="text-sm font-bold text-slate-500">
                  \${computedStats.nonBillableSalaries.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </button>`;

code = code.replace(oldNonBillableHeader, newNonBillableHeader);

fs.writeFileSync(file, code);

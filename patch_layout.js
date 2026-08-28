const fs = require('fs');
const file = 'src/components/projects/ProjectManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// Import useAppSettings
code = code.replace(
  "import { useAuth } from '@/lib/auth/AuthContext';",
  "import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';"
);

// Call useAppSettings
code = code.replace(
  "const { dbUser } = useAuth();",
  "const { dbUser } = useAuth();\n  const { formatCurrency, areaUnit } = useAppSettings();"
);

// Compute cost and fee, activeProject
code = code.replace(
  "const sortedProjects = [...projects]",
  `const activeProject = projects.find(p => p.id === activeProjectId);
  const totalCost = allocations.reduce((sum, a) => sum + (a.hours * (teamMembers.find(m => m.id === a.memberId)?.costPerHour || 0)), 0) + 
    projectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
  const profitMarginPercent = activeProject?.profitMargin ?? 0;
  const profitMarginAmount = totalCost * (profitMarginPercent / 100);
  const totalFee = totalCost + profitMarginAmount;

  const sortedProjects = [...projects]`
);

// Replace project container height
code = code.replace(
  'className={`p-3.5 rounded-xl cursor-pointer flex justify-between items-center group transition-colors ${activeProjectId === p.id ? \'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm\' : \'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent\'}`}',
  'className={`p-3.5 pb-2 rounded-xl cursor-pointer flex flex-col group transition-colors ${activeProjectId === p.id ? \'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm\' : \'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent\'}`}'
);
code = code.replace(
  '<div className="flex items-center gap-3 overflow-hidden pr-2 flex-1">',
  '<div className="flex items-center justify-between gap-3 overflow-hidden w-full">\n<div className="flex items-center gap-3 overflow-hidden flex-1">'
);
code = code.replace(
  '</span>\n                  {!isTemplateMode',
  '</span>\n                  </div>\n                  {!isTemplateMode'
);
code = code.replace(
  '<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">',
  '<div className="flex justify-end items-center gap-1 h-7 opacity-0 group-hover:opacity-100 transition-opacity mt-1">'
);

// Replace Layout
// We need to find "<!-- Phases Manager -->" (actually {/* Phases Manager */})
// And wrap it with PaymentScheduleManager.

let phasesStart = code.indexOf('{/* Phases Manager */}');
let paymentStart = code.indexOf('{activeProjectId ? (\n        <PaymentScheduleManager');
if (paymentStart === -1) {
  paymentStart = code.indexOf('<PaymentScheduleManager');
}
// Find the end of PaymentScheduleManager
let paymentEnd = code.indexOf('</div>\n    </div>\n  );\n}');
if (paymentEnd === -1) {
  paymentEnd = code.indexOf('    </div>\n  );\n}');
}

let beforePhases = code.substring(0, phasesStart);
let phasesAndPayment = code.substring(phasesStart, paymentEnd);
let afterPayment = code.substring(paymentEnd);

let newLayout = `
      {/* Right Content */}
      <div className="flex-[2] flex flex-col gap-6 min-h-0 overflow-hidden">
        {activeProject && !isTemplateMode && (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-center justify-between shrink-0 transition-colors">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">{activeProject.name}</h2>
                <span className={\`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full \${getStatusColor(activeProject.status || 'Draft')}\`}>
                  {activeProject.status || 'Draft'}
                </span>
              </div>
              {activeProject.area && <span className="text-sm text-slate-500 mt-1">{activeProject.area} {areaUnit}</span>}
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Cost</span>
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(totalCost)}
                </span>
              </div>
              <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Profit Margin</span>
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{profitMarginPercent}%</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5">Total Fee</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalFee)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
          ${phasesAndPayment}
        </div>
      </div>
`;

code = beforePhases + newLayout + afterPayment;

fs.writeFileSync(file, code);
console.log('patched');

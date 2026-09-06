const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add Calculator and useRouter
code = code.replace(
  "import { Folder, CalendarDays, Lock } from 'lucide-react';",
  "import { Folder, CalendarDays, Lock, Calculator } from 'lucide-react';\nimport { useRouter } from 'next/navigation';"
);

// Add router inside GanttPlanner
code = code.replace(
  "const { dbCompany } = useAuth();",
  "const { dbCompany } = useAuth();\n  const router = useRouter();"
);

// Add the link in the project list
const searchString = `<div className="flex items-center justify-between gap-3 overflow-hidden w-full">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <Folder size={20} className={\`shrink-0 \${activeProjectId === p.id ? "text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" : "text-slate-400 dark:text-slate-500"}\`} />
                  <span className={\`font-semibold text-sm truncate \${activeProjectId === p.id ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}\`}>{p.name}</span>
                </div>
              </div>`;

const replaceString = `<div className="flex items-center justify-between gap-3 overflow-hidden w-full">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <Folder size={20} className={\`shrink-0 \${activeProjectId === p.id ? "text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" : "text-slate-400 dark:text-slate-500"}\`} />
                  <span className={\`font-semibold text-sm truncate \${activeProjectId === p.id ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}\`}>{p.name}</span>
                </div>
                <div className="flex justify-end items-center gap-1 h-7 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <button onClick={(e) => { e.stopPropagation(); router.push(\`/dashboard?project=\${p.id}\`); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors" title="Open Fee Proposal">
                    <Calculator size={14} />
                  </button>
                </div>
              </div>`;

code = code.replace(searchString, replaceString);

fs.writeFileSync(file, code);

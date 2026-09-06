const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('collapsedPhases')) {
  code = code.replace(
    "import { Folder, CalendarDays, Lock, Calculator } from 'lucide-react';",
    "import { Folder, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft } from 'lucide-react';"
  );
  
  code = code.replace(
    "const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);",
    "const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);\n  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());"
  );
  
  const buttonsHtml = `
                     <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
                        <button 
                           onClick={() => {
                             if (collapsedPhases.size > 0) setCollapsedPhases(new Set());
                             else setCollapsedPhases(new Set(phases.map(p => p.id!)));
                           }}
                           className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                           {collapsedPhases.size > 0 ? <><ChevronsRight size={14} /> Expand All</> : <><ChevronsLeft size={14} /> Collapse All</>}
                        </button>
                     </div>
  `;
  
  code = code.replace(
    '<div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">',
    buttonsHtml + '<div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">'
  );
  
  code = code.replace(
    "<GanttGrid ",
    `<GanttGrid \n                collapsedPhases={collapsedPhases}\n                setCollapsedPhases={setCollapsedPhases}\n`
  );
  
  fs.writeFileSync(file, code);
}

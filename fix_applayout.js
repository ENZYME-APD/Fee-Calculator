const fs = require('fs');
const file = 'src/components/layout/AppLayout.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { PanelLeftClose, PanelLeftOpen, Users, ChevronDown, ChevronRight, PlusCircle, Menu, Edit3, Check } from 'lucide-react';",
  "import { PanelLeftClose, PanelLeftOpen, Users, ChevronDown, ChevronRight, PlusCircle, Menu, Edit3, Check, CalendarDays } from 'lucide-react';\nimport Link from 'next/link';"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setIsProjectSettingsOpen\(true\)\}\n\s*className="text-slate-400 hover:text-blue-500 p-1 hover:bg-blue-50 dark:hover:bg-blue-900\/30 rounded-full transition-colors"\n\s*>\n\s*<Edit3 size=\{14\} \/>\n\s*<\/button>/g,
  `<button 
                          onClick={() => setIsProjectSettingsOpen(true)}
                          className="text-slate-400 hover:text-blue-500 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                          title="Edit Project"
                        >
                          <Edit3 size={14} />
                        </button>
                        <Link href={\`/planning?project=\${project.id}\`}>
                          <button 
                            className="text-slate-400 hover:text-emerald-500 p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors"
                            title="Open in Planner"
                          >
                            <CalendarDays size={14} />
                          </button>
                        </Link>`
);

fs.writeFileSync(file, code);

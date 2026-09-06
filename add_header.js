const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

// Need to calculate costs
// Budgeted Cost = same logic as AppLayout (allocations + projectCosts)
// Planned Cost = tasks.reduce((sum, task) => sum + (task.durationHours * (members.find(m => m.id === task.memberId)?.costPerHour || 0)), 0)

const importAuth = `import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';`;
code = code.replace(`import { useAuth } from '@/lib/auth/AuthContext';`, importAuth);

code = code.replace(
  "const { dbCompany } = useAuth();\n  const router = useRouter();",
  "const { dbCompany } = useAuth();\n  const { formatCurrency } = useAppSettings();\n  const router = useRouter();"
);

// We need projectCosts to compute budgeted cost accurately.
// Right now GanttPlanner fetches phases and tasks. We need to fetch projectCosts too.
code = code.replace(
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask } from '@/lib/firebase/db';",
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts } from '@/lib/firebase/db';"
);
code = code.replace(
  "import { Project, Phase, TeamMember, ProjectTask, Allocation } from '@/lib/firebase/schema';",
  "import { Project, Phase, TeamMember, ProjectTask, Allocation, ProjectCost } from '@/lib/firebase/schema';"
);

code = code.replace(
  "const [tasks, setTasks] = useState<ProjectTask[]>([]);",
  "const [tasks, setTasks] = useState<ProjectTask[]>([]);\n  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);"
);

code = code.replace(
  "const [pPhases, pTasks] = await Promise.all([",
  "const [pPhases, pTasks, pCosts] = await Promise.all(["
);
code = code.replace(
  "getPhases(projectId),",
  "getPhases(projectId),\n      getProjectCosts(projectId),"
);
code = code.replace(
  "setTasks(pTasks);",
  "setTasks(pTasks);\n    setProjectCosts(pCosts);"
);

// Now the header UI
const headerUI = `{activeProjectId ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Summary Header */}
            {(() => {
               const project = projects.find(p => p.id === activeProjectId)!;
               const projectAllocs = allocations.filter(a => a.projectId === activeProjectId);
               
               const budgetedCost = projectAllocs.reduce((sum, a) => sum + (a.hours * (members.find(m => m.id === a.memberId)?.costPerHour || 0)), 0) + 
                  projectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
               
               const plannedCost = tasks.reduce((sum, t) => sum + (t.durationHours * (members.find(m => m.id === t.memberId)?.costPerHour || 0)), 0);
               
               const diff = budgetedCost - plannedCost;
               const isOverBudget = diff < 0;

               return (
                 <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                   <div>
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{project.name}</h2>
                     <p className="text-sm text-slate-500 mt-1">Resource & Task Planning</p>
                   </div>
                   <div className="flex items-center gap-6">
                     <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Budgeted Cost</span>
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(budgetedCost)}</span>
                     </div>
                     <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Planned Cost</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(plannedCost)}</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Variance</span>
                        <span className={\`text-lg font-bold \${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}\`}>
                          {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(diff))}
                        </span>
                     </div>
                   </div>
                 </div>
               );
            })()}
            <div className="flex-1 overflow-hidden relative">
              <GanttGrid 
                project={projects.find(p => p.id === activeProjectId)!}
                phases={phases}
                members={members}
                allocations={allocations.filter(a => a.projectId === activeProjectId)}
                tasks={tasks}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>
          </div>
        ) : (`;

code = code.replace(
  /{activeProjectId \? \([\s\S]*?<GanttGrid[\s\S]*?\/>\s*\) : \(/,
  headerUI
);

fs.writeFileSync(file, code);

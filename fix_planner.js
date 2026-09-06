const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts, deleteProjectTask } from '@/lib/firebase/db';",
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts, deleteProjectTask, addAllocation, updateAllocation } from '@/lib/firebase/db';"
);

code = code.replace(
  "import { Folder, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft } from 'lucide-react';",
  "import { Folder, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft, RefreshCw } from 'lucide-react';"
);

code = code.replace(
  "import { useRouter } from 'next/navigation';",
  "import { useRouter, useSearchParams } from 'next/navigation';"
);

code = code.replace(
  "export function GanttPlanner() {",
  `export function GanttPlanner() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');`
);

code = code.replace(
  "const [activeProjectId, setActiveProjectId] = useState<string | null>(null);",
  "const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId || null);\n  const [isSyncing, setIsSyncing] = useState(false);"
);

// We need an effect to sync activeProjectId
code = code.replace(
  "useEffect(() => {",
  `useEffect(() => {
    if (initialProjectId && initialProjectId !== activeProjectId) {
      setActiveProjectId(initialProjectId);
    }
  }, [initialProjectId]);
  
  useEffect(() => {`
);

const syncFunc = `
  const handleSyncBudget = async () => {
    if (!activeProjectId || !dbUser) return;
    setIsSyncing(true);
    
    const plannedAllocations: Record<string, number> = {};
    tasks.forEach(task => {
        const key = \`\${task.phaseId}_\${task.memberId}\`;
        plannedAllocations[key] = (plannedAllocations[key] || 0) + task.durationHours;
    });

    const projectPhases = phases.filter(p => p.projectId === activeProjectId);
    const phaseIds = projectPhases.map(p => p.id);
    const projectAllocations = allocations.filter(a => phaseIds.includes(a.phaseId));
    
    const promises = [];
    
    for (const key in plannedAllocations) {
        const [phaseId, memberId] = key.split('_');
        const plannedHours = plannedAllocations[key];
        
        const existing = projectAllocations.find(a => a.phaseId === phaseId && a.memberId === memberId);
        
        if (existing) {
            if (existing.hours !== plannedHours) {
                promises.push(updateAllocation(existing.id, { hours: plannedHours }));
            }
        } else {
            promises.push(addAllocation({ companyId: dbUser.companyId, projectId: activeProjectId, phaseId, memberId, hours: plannedHours }));
        }
    }
    
    for (const existing of projectAllocations) {
        const key = \`\${existing.phaseId}_\${existing.memberId}\`;
        if (!plannedAllocations[key] && existing.hours > 0) {
            promises.push(updateAllocation(existing.id, { hours: 0 }));
        }
    }
    
    await Promise.all(promises);
    const updatedAllocations = await getAllocations(dbUser.companyId);
    setAllocations(updatedAllocations);
    setIsSyncing(false);
  };
`;

code = code.replace(
  "return (",
  syncFunc + "\n  return ("
);

const syncButton = `
                        <button 
                           onClick={handleSyncBudget}
                           disabled={isSyncing}
                           className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm mr-2"
                           title="Overwrite budget with planner tasks"
                        >
                           <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> Sync Budget
                        </button>
                        <button 
`;

code = code.replace(
  /<button \n\s*onClick=\{\(\) => \{\n\s*if \(collapsedPhases\.size > 0\)/,
  syncButton.trim() + "\n                           onClick={() => {\n                             if (collapsedPhases.size > 0)"
);

fs.writeFileSync(file, code);

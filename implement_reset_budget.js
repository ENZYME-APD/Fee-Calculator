const fs = require('fs');

const plannerFile = 'src/components/planning/GanttPlanner.tsx';
let plannerCode = fs.readFileSync(plannerFile, 'utf8');

// Add Undo2 import
plannerCode = plannerCode.replace(
  "import { Folder, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft, RefreshCw } from 'lucide-react';",
  "import { Folder, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft, RefreshCw, Undo2 } from 'lucide-react';"
);

// Add isResetting state
plannerCode = plannerCode.replace(
  'const [isSyncing, setIsSyncing] = useState(false);',
  'const [isSyncing, setIsSyncing] = useState(false);\n  const [isResetting, setIsResetting] = useState(false);'
);

// Add handleResetToBudget function
const resetFunc = `
  const handleResetToBudget = async () => {
    if (!activeProjectId || !dbCompany) return;
    if (!window.confirm('Are you sure you want to reset all tasks? This will delete all current tasks in the Gantt chart and recreate them to match the original budget allocations. This cannot be undone.')) return;
    
    setIsResetting(true);
    
    const projectPhases = phases.filter(p => p.projectId === activeProjectId);
    const phaseIds = projectPhases.map(p => p.id);
    const projectAllocations = allocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
    const currentTasks = tasks.filter(t => t.projectId === activeProjectId);
    
    try {
      // 1. Delete all current tasks
      const deletePromises = currentTasks.map(t => deleteProjectTask(t.id!));
      await Promise.all(deletePromises);
      
      // 2. Create new tasks from allocations
      const createPromises = projectAllocations.map(a => {
        const phase = projectPhases.find(p => p.id === a.phaseId);
        const newTask = {
          projectId: activeProjectId,
          phaseId: a.phaseId,
          memberId: a.memberId,
          name: 'Planned Task',
          startDate: phase?.startDate || Date.now(),
          durationHours: a.hours,
          order: 0
        };
        return addProjectTask(newTask);
      });
      await Promise.all(createPromises);
      
      // 3. Reload
      const pTasks = await getProjectTasks(activeProjectId);
      setTasks(pTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };
`;

// Insert the function after handleSyncBudget
plannerCode = plannerCode.replace(
  'const handleTaskCreate = async',
  resetFunc + '\n  const handleTaskCreate = async'
);

// Add the button next to Sync Budget
plannerCode = plannerCode.replace(
  '</button>\n                        <button\n                           onClick={() => {',
  '</button>\n                        <button onClick={handleResetToBudget} disabled={isResetting || loading} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-3 py-1.5 rounded-md transition-all shadow-sm disabled:opacity-50">\n                          <Undo2 size={14} className={isResetting ? "animate-spin" : ""} /> Reset to Budget\n                        </button>\n                        <button\n                           onClick={() => {'
);

fs.writeFileSync(plannerFile, plannerCode);

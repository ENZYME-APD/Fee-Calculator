const fs = require('fs');

const ganttFile = 'src/components/planning/GanttPlanner.tsx';
let ganttCode = fs.readFileSync(ganttFile, 'utf8');

// 1. Import ConfirmModal
if (!ganttCode.includes('ConfirmModal')) {
  ganttCode = ganttCode.replace(
    "import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';",
    "import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
  );
}

// 2. Add state
if (!ganttCode.includes('showResetConfirm')) {
  ganttCode = ganttCode.replace(
    '  const [isResetting, setIsResetting] = useState(false);',
    '  const [isResetting, setIsResetting] = useState(false);\n  const [showResetConfirm, setShowResetConfirm] = useState(false);'
  );
}

// 3. Rewrite handleResetToBudget
const oldReset = `  const handleResetToBudget = async () => {
    if (!activeProjectId || !dbCompany) return;
    if (!window.confirm('Are you sure you want to reset all tasks? This will delete all current tasks in the Gantt chart and recreate them to match the original budget allocations. This cannot be undone.')) return;
    
    setIsResetting(true);`;

const newReset = `  const handleResetToBudget = () => {
    setShowResetConfirm(true);
  };

  const executeResetToBudget = async () => {
    setShowResetConfirm(false);
    if (!activeProjectId || !dbCompany) return;
    
    setIsResetting(true);`;

ganttCode = ganttCode.replace(oldReset, newReset);


// 4. Fix Buttons
const oldButtons = `                     <div className="flex flex-row items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
                        <button 
                           onClick={handleSyncBudget}
                           disabled={isSyncing}
                           className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm"
                           title="Overwrite budget with planner tasks"
                        >
                           <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> Sync Budget
                        </button>
                        <button onClick={handleResetToBudget} disabled={isResetting || loading} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-3 py-1.5 rounded-md transition-all shadow-sm disabled:opacity-50">
                          <Undo2 size={14} className={isResetting ? "animate-spin" : ""} /> Reset to Budget
                        </button>
                        <button
                           onClick={() => {
                             if (collapsedPhases.size > 0) setCollapsedPhases(new Set());
                             else setCollapsedPhases(new Set(phases.map(p => p.id!)));
                           }}
                           className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                           {collapsedPhases.size > 0 ? <ChevronsRight size={14}/> : <ChevronsLeft size={14} />} 
                           {collapsedPhases.size > 0 ? "Expand All" : "Collapse All"}
                        </button>
                     </div>`;

const newButtons = `                     <div className="flex flex-row items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
                        <button 
                           onClick={handleSyncBudget}
                           disabled={isSyncing}
                           className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm whitespace-nowrap"
                           title="Overwrite budget with planner tasks"
                        >
                           <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Update
                        </button>
                        <button onClick={handleResetToBudget} disabled={isResetting || loading} className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
                          <Undo2 size={16} className={isResetting ? "animate-spin" : ""} /> Reset
                        </button>
                        <button
                           onClick={() => {
                             if (collapsedPhases.size > 0) setCollapsedPhases(new Set());
                             else setCollapsedPhases(new Set(phases.map(p => p.id!)));
                           }}
                           className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap"
                        >
                           {collapsedPhases.size > 0 ? <ChevronsRight size={16}/> : <ChevronsLeft size={16} />} 
                           {collapsedPhases.size > 0 ? "Expand" : "Collapse"}
                        </button>
                     </div>`;

ganttCode = ganttCode.replace(oldButtons, newButtons);

// 5. Add ConfirmModal
const modalJSX = `      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset to Budget"
        message="Are you sure you want to reset all tasks? This will delete all current tasks in the Gantt chart and recreate them to match the original budget allocations. This cannot be undone."
        confirmText="Reset Timeline"
        onConfirm={executeResetToBudget}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>`;

ganttCode = ganttCode.replace('    </div>\n  );\n}', modalJSX + '\n  );\n}');

fs.writeFileSync(ganttFile, ganttCode);

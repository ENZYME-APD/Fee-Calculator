const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

const newButtons = `<div className="flex flex-row items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
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
                           {collapsedPhases.size > 0 ? <><ChevronsRight size={16}/> Expand</> : <><ChevronsLeft size={16} /> Collapse</>}
                        </button>
                     </div>`;

// We'll replace the block from <div className="flex flex-row items-center gap-2 border-r
// all the way down to </div> before <div className="flex flex-col items-end border-r
const regex = /<div className="flex flex-row items-center gap-2 border-r[\s\S]*?<\/div>\s*<div className="flex flex-col items-end border-r/;

if (regex.test(code)) {
    code = code.replace(regex, newButtons + '\\n                     <div className="flex flex-col items-end border-r');
    fs.writeFileSync(file, code);
    console.log("Replaced successfully.");
} else {
    console.log("Could not find the target block.");
}

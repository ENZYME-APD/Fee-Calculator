const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix the \n literal
code = code.replace(/<\/div>\\n                     <div className="flex flex-col items-end border-r/, '</div>\n                     <div className="flex flex-col items-end border-r');

// 2. Reduce the size of the buttons
code = code.replace(/text-sm font-semibold text-emerald-600/g, 'text-xs font-semibold text-emerald-600');
code = code.replace(/px-4 py-2 rounded-lg border border-emerald-200/g, 'px-3 py-1.5 rounded-md border border-emerald-200');
code = code.replace(/<RefreshCw size={16}/g, '<RefreshCw size={14}');

code = code.replace(/text-sm font-semibold text-rose-600/g, 'text-xs font-semibold text-rose-600');
code = code.replace(/px-4 py-2 rounded-lg transition-all/g, 'px-3 py-1.5 rounded-md transition-all');
code = code.replace(/<Undo2 size={16}/g, '<Undo2 size={14}');

code = code.replace(/text-sm font-semibold text-slate-600/g, 'text-xs font-semibold text-slate-600');
code = code.replace(/px-4 py-2 rounded-lg border border-slate-200/g, 'px-3 py-1.5 rounded-md border border-slate-200');
code = code.replace(/<ChevronsRight size={16}/g, '<ChevronsRight size={14}');
code = code.replace(/<ChevronsLeft size={16}/g, '<ChevronsLeft size={14}');

// 3. Make title wrap properly and take available space
code = code.replace(/<div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50\/50 dark:bg-slate-900\/50 shrink-0">/, '<div className="flex items-start md:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 gap-6 flex-wrap md:flex-nowrap">');
code = code.replace(/<div>\n                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">\{project\.name\}<\/h2>/, '<div className="min-w-[200px] flex-1">\n                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{project.name}</h2>');

fs.writeFileSync(file, code);

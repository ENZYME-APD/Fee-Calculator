const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

// Wrap the buttons in a full-width hover catcher
const oldButtons = `<div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity z-50 print:hidden flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Add</span>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('rich_text'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Text"><FileText size={14} /></button>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('financial_summary'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Financials"><Calculator size={14} /></button>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('team_breakdown'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Team"><Users size={14} /></button>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('payment_schedule'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Payments"><CreditCard size={14} /></button>
      </div>`;

const newButtons = `<div className="absolute -bottom-6 left-0 right-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity z-50 print:hidden cursor-default">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Add</span>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('rich_text'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Text"><FileText size={14} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('financial_summary'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Financials"><Calculator size={14} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('team_breakdown'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Team"><Users size={14} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('payment_schedule'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Payments"><CreditCard size={14} /></button>
        </div>
      </div>`;

if (code.includes(oldButtons)) {
  code = code.replace(oldButtons, newButtons);
  fs.writeFileSync(file, code);
  console.log("Success");
} else {
  console.log("Failed to find block");
}


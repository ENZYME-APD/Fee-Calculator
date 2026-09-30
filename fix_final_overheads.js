const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix backslashes
code = code.replace(/\\\$/g, '$');

// 2. Expand/Collapse All
const collapseAllFunctions = `  const handleExpandAll = () => {
    setIsNonBillableCollapsed(false);
    const newCols: Record<string, boolean> = {};
    categories.forEach(c => newCols[c.id] = false);
    setCollapsedCategories(newCols);
  };
  
  const handleCollapseAll = () => {
    setIsNonBillableCollapsed(true);
    const newCols: Record<string, boolean> = {};
    categories.forEach(c => newCols[c.id] = true);
    setCollapsedCategories(newCols);
  };`;

if (!code.includes('handleExpandAll')) {
  code = code.replace('const handleSave = async () => {', collapseAllFunctions + '\n\n  const handleSave = async () => {');
}

// Add the buttons to the Data Entry header area.
// Where is the Data Entry section?
// <div className="lg:col-span-3 space-y-6">
const dataEntryStart = `<div className="lg:col-span-3 space-y-6">`;
const newDataEntryStart = `<div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center bg-transparent">
              <h2 className="text-xl font-bold">Expense Categories</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleExpandAll} className="text-sm text-blue-500 hover:text-blue-600 font-bold px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">Expand All</button>
                <button onClick={handleCollapseAll} className="text-sm text-slate-500 hover:text-slate-600 font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">Collapse All</button>
              </div>
            </div>`;
if (!code.includes('Expand All')) {
  code = code.replace(dataEntryStart, newDataEntryStart);
}

// 3. Full width categories
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-6">',
  '<div className="flex flex-col space-y-6">'
);

// 4. Monthly / Yearly Inputs
// Replace the old header row for categories
const oldHeader = `<div className="flex items-center gap-3 px-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="w-3"></div>
                            <div className="flex-1 min-w-0 pl-1">Expense</div>
                            <div className="w-[84px] text-right pr-6">Yearly Cost</div>
                          </div>`;
const newHeader = `<div className="flex items-center gap-3 px-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="w-3"></div>
                            <div className="flex-1 min-w-0 pl-1">Expense</div>
                            <div className="w-20 text-right">Monthly</div>
                            <div className="w-24 text-right pr-6">Yearly Total</div>
                          </div>`;
code = code.replace(oldHeader, newHeader);

// Replace the item row
const oldItemRow = `<div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400 text-sm">$</span>
                                  <input 
                                    type="number"
                                    value={item.yearlyCost || ''}
                                    onChange={e => updateItem(cat.id, item.id, { yearlyCost: Number(e.target.value) })}
                                    className="w-16 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none text-right"
                                  />
                                </div>
                                <button onClick={() => removeItem(cat.id, item.id)} className="text-slate-400 hover:text-red-500 shrink-0">
                                  <Trash2 size={14} />
                                </button>`;
const newItemRow = `<div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400 text-sm">$</span>
                                  <input 
                                    type="number"
                                    value={Math.round((item.yearlyCost || 0) / 12) || ''}
                                    onChange={e => updateItem(cat.id, item.id, { yearlyCost: Number(e.target.value) * 12 })}
                                    className="w-16 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none text-right"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400 text-sm">$</span>
                                  <input 
                                    type="number"
                                    value={item.yearlyCost || ''}
                                    onChange={e => updateItem(cat.id, item.id, { yearlyCost: Number(e.target.value) })}
                                    className="w-20 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm font-bold outline-none text-right text-slate-700 dark:text-slate-200"
                                    placeholder="0"
                                  />
                                </div>
                                <button onClick={() => removeItem(cat.id, item.id)} className="text-slate-400 hover:text-red-500 shrink-0 ml-2">
                                  <Trash2 size={14} />
                                </button>`;

code = code.replace(oldItemRow, newItemRow);


fs.writeFileSync(file, code);

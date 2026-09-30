const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add padding back to the main container
code = code.replace(
  '<div className="h-full w-full overflow-y-auto pb-24 text-slate-900 dark:text-white">',
  '<div className="h-full w-full overflow-y-auto p-8 pb-24 text-slate-900 dark:text-white">'
);

// 2. Shrink Top Buttons
code = code.replace(
  /className="flex items-center gap-2 px-4 py-2 bg-slate-200/g,
  'className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200'
);
code = code.replace(
  'className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"',
  'className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"'
);
code = code.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-purple-600',
  'className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600'
);
code = code.replace(
  'text-xl font-bold tracking-tight',
  'text-2xl font-bold tracking-tight'
); // Slightly adjust title size to fit with smaller buttons
code = code.replace(/size=\{32\}/, 'size={28}');

// 3. Shrink non-billable table padding and font size
code = code.replace(
  /<th className="p-4 border-b border-slate-100 dark:border-slate-800">/g,
  '<th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">'
);
code = code.replace(
  /<th className="p-4 border-b border-slate-100 dark:border-slate-800 text-right">/g,
  '<th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-right">'
);

code = code.replace(/<td className="p-4/g, '<td className="px-4 py-2 text-sm');

// Also shrink the category headers in the non-billable table
code = code.replace(
  /className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400"/g,
  'className="px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500"'
);


// 4. Add header to expenses categories
const itemsBlock = `{cat.items.map(item => (`;
const headerToAdd = `
                          <div className="flex items-center gap-3 px-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="w-3"></div>
                            <div className="flex-1 min-w-0 pl-1">Expense</div>
                            <div className="w-[84px] text-right pr-6">Yearly Cost</div>
                          </div>
                          {cat.items.map(item => (
`;

if (!code.includes('Yearly Cost</div>')) {
  code = code.replace(itemsBlock, headerToAdd);
}

fs.writeFileSync(file, code);

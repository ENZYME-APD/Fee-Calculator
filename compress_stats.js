const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Compress spaces in the left column
// Replace `space-y-6` on left column
code = code.replace('<div className="lg:col-span-1 space-y-6">', '<div className="lg:col-span-1 space-y-4">');

// Replace p-6 with p-4 in stats cards
code = code.replace(/className="bg-white dark:bg-slate-900 p-6 rounded-2xl/g, 'className="bg-white dark:bg-slate-900 p-4 rounded-2xl');

// Compress margin bottom in summary
code = code.replace(/className="mb-6"/g, 'className="mb-3"');
code = code.replace(/text-3xl/g, 'text-2xl'); // smaller total text
code = code.replace(/text-xl/g, 'text-lg'); // smaller burn rate text
code = code.replace(/text-2xl/g, 'text-xl'); // smaller multiplier text
code = code.replace(/h-48/g, 'h-32'); // smaller chart

fs.writeFileSync(file, code);

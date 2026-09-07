const fs = require('fs');
const file = 'src/components/layout/Navigation.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = 'className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 z-50 transition-colors duration-300"';
const newStr = 'className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 z-50 transition-colors duration-300 print:hidden"';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync(file, code);
  console.log('Fixed Navigation.tsx');
} else {
  console.log('Target string not found');
}

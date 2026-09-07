const fs = require('fs');
const file = 'src/components/documents/DocumentBuilder.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'className="w-full max-w-[850px] mx-auto bg-white dark:bg-slate-900 print:shadow-none shadow-xl border border-slate-200 dark:border-slate-800 min-h-[1100px] p-16 print:p-0 relative"',
  'className="w-full max-w-[850px] mx-auto bg-white dark:bg-slate-900 print:shadow-none shadow-xl border border-slate-200 dark:border-slate-800 print:border-none min-h-[1100px] p-16 print:p-0 relative"'
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/projects/PaymentScheduleManager.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<div className="w-32">\n              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">% Value</label>',
  '<div className="w-24">\n              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">% Value</label>'
);

code = code.replace(
  '<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Link to Phase</label>',
  '<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phase</label>'
);

fs.writeFileSync(file, code);

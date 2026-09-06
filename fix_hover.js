const fs = require('fs');
const file = 'src/components/planning/GanttGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix row sticky left column hover
code = code.replace(
  "group-hover/row:bg-slate-50/50 dark:group-hover/row:bg-slate-900/20",
  "group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-900"
);

// Fix Add Team Member button sticky background
code = code.replace(
  "bg-slate-50/50 dark:bg-slate-900/30",
  "bg-slate-50 dark:bg-slate-900"
);

fs.writeFileSync(file, code);

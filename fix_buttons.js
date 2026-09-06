const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">',
  '<div className="flex flex-row items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">'
);

// also remove the `mr-2` from the Sync Budget button classes, so they just use the container's gap-2
code = code.replace(
  'shadow-sm mr-2"\n                           title="Overwrite budget with planner tasks"',
  'shadow-sm"\n                           title="Overwrite budget with planner tasks"'
);

fs.writeFileSync(file, code);

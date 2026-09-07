const fs = require('fs');

const plannerFile = 'src/components/planning/GanttPlanner.tsx';
let plannerCode = fs.readFileSync(plannerFile, 'utf8');

plannerCode = plannerCode.replace(
  "startDate: phase?.startDate || Date.now(),",
  "startDate: Date.now(),\n          description: '',\n          includeWeekends: false,"
);

fs.writeFileSync(plannerFile, plannerCode);

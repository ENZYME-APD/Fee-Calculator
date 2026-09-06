const fs = require('fs');
const file = 'src/app/(app)/planning/page.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('Suspense')) {
  code = code.replace(
    "import { GanttPlanner } from '@/components/planning/GanttPlanner';",
    "import { GanttPlanner } from '@/components/planning/GanttPlanner';\nimport { Suspense } from 'react';"
  );
  
  code = code.replace(
    "<GanttPlanner />",
    "<Suspense fallback={<div>Loading planner...</div>}><GanttPlanner /></Suspense>"
  );
}

fs.writeFileSync(file, code);

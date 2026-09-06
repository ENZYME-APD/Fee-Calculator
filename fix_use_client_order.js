const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

if (code.includes('import { ProUpgradePrompt }') && code.includes('"use client";')) {
  // Remove them both
  code = code.replace("import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';\n", "");
  code = code.replace('"use client";\n', "");
  
  // Add them back in the correct order
  code = '"use client";\nimport { ProUpgradePrompt } from \'@/components/ui/ProUpgradePrompt\';\n' + code;
  
  fs.writeFileSync(file, code);
}

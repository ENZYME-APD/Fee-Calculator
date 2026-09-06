const fs = require('fs');

// 1. Fix GanttPlanner
const ganttFile = 'src/components/planning/GanttPlanner.tsx';
let ganttCode = fs.readFileSync(ganttFile, 'utf8');
if (!ganttCode.includes('import { ProUpgradePrompt }')) {
  ganttCode = "import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';\n" + ganttCode;
  fs.writeFileSync(ganttFile, ganttCode);
}

// 2. Fix WikiContent
const wikiFile = 'src/components/wiki/WikiContent.tsx';
let wikiCode = fs.readFileSync(wikiFile, 'utf8');

wikiCode = wikiCode.replace('ShieldAlert,', 'ShieldAlert,\n  FileText,\n  Download,');

fs.writeFileSync(wikiFile, wikiCode);

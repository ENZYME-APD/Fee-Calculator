const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('ProUpgradePrompt')) {
  // 1. add import
  code = code.replace(
    "import { FileSpreadsheet, Download, RefreshCw, ChevronsRight, ChevronsLeft, CalendarDays } from 'lucide-react';",
    "import { FileSpreadsheet, Download, RefreshCw, ChevronsRight, ChevronsLeft, CalendarDays } from 'lucide-react';\nimport { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';"
  );
  
  // 2. add check after loading
  const target = 'if (loading) return <div className="p-8 text-slate-500">Loading planner...</div>;';
  const newCode = `if (loading) return <div className="p-8 text-slate-500">Loading planner...</div>;

  if (dbCompany?.tier !== 'pro' && dbCompany?.subscriptionStatus !== 'lifetime') {
    return <ProUpgradePrompt 
      title="Advanced Project Planning" 
      description="The Gantt Planner lets you visually allocate team members on a timeline, skip weekends, and sync your planned hours perfectly with your budgeted fee proposal." 
    />;
  }`;
  
  code = code.replace(target, newCode);
  fs.writeFileSync(file, code);
}

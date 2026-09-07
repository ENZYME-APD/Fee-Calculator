const fs = require('fs');

// 1. Fix DB.ts - add payment schedule to default blocks
const dbFile = 'src/lib/firebase/db.ts';
let dbCode = fs.readFileSync(dbFile, 'utf8');

const oldDefaultBlocks = `
    { companyId, projectId, type: 'rich_text', title: 'Introduction', content: '<p>Welcome to the fee proposal.</p>', order: 0 },
    { companyId, projectId, type: 'phase_scope', title: 'Project Scope', content: '', order: 1 },
    { companyId, projectId, type: 'financial_summary', title: 'Financial Summary', content: '', order: 2 },
    { companyId, projectId, type: 'team_breakdown', title: 'Team Allocation', content: '', order: 3 },
    { companyId, projectId, type: 'rich_text', title: 'Terms & Conditions', content: '<p>Standard terms apply.</p>', order: 4 }
`;

const newDefaultBlocks = `
    { companyId, projectId, type: 'rich_text', title: 'Introduction', content: '<p>Welcome to the fee proposal.</p>', order: 0 },
    { companyId, projectId, type: 'phase_scope', title: 'Project Scope', content: '', order: 1 },
    { companyId, projectId, type: 'financial_summary', title: 'Financial Summary', content: '', order: 2 },
    { companyId, projectId, type: 'payment_schedule', title: 'Payment Schedule', content: '', order: 3 },
    { companyId, projectId, type: 'team_breakdown', title: 'Team Allocation', content: '', order: 4 },
    { companyId, projectId, type: 'rich_text', title: 'Terms & Conditions', content: '<p>Standard terms apply.</p>', order: 5 }
`;

if (dbCode.includes(oldDefaultBlocks.trim())) {
  dbCode = dbCode.replace(oldDefaultBlocks.trim(), newDefaultBlocks.trim());
  fs.writeFileSync(dbFile, dbCode);
}

// 2. Fix DocumentBuilder.tsx - add mx-auto to empty state and fix title logic
const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

docCode = docCode.replace(
  'className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 h-full max-w-md text-center"',
  'className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 h-[60vh] max-w-md mx-auto text-center"'
);

docCode = docCode.replace(
  "title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : 'Project Scope',",
  "title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : type === 'payment_schedule' ? 'Payment Schedule' : 'Project Scope',"
);

fs.writeFileSync(docFile, docCode);

// 3. Fix SortableBlock.tsx - remove \ from dollar signs
const blockFile = 'src/components/documents/SortableBlock.tsx';
let blockCode = fs.readFileSync(blockFile, 'utf8');

blockCode = blockCode.replace(/\\\$\{/g, '${');

fs.writeFileSync(blockFile, blockCode);


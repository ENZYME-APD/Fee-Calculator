const fs = require('fs');

// 1. CSS
const cssFile = 'src/app/globals.css';
let cssCode = fs.readFileSync(cssFile, 'utf8');
if (!cssCode.includes('@tailwindcss/typography')) {
  cssCode = cssCode.replace(
    '@import "tailwindcss";',
    '@import "tailwindcss";\n@plugin "@tailwindcss/typography";'
  );
  fs.writeFileSync(cssFile, cssCode);
}

// 2. Schema
const schemaFile = 'src/lib/firebase/schema.ts';
let schemaCode = fs.readFileSync(schemaFile, 'utf8');
schemaCode = schemaCode.replace(
  "type: 'rich_text' | 'phase_scope' | 'financial_summary' | 'team_breakdown';",
  "type: 'rich_text' | 'phase_scope' | 'financial_summary' | 'team_breakdown' | 'payment_schedule';"
);
fs.writeFileSync(schemaFile, schemaCode);

// 3. DocumentBuilder.tsx
const builderFile = 'src/components/documents/DocumentBuilder.tsx';
let builderCode = fs.readFileSync(builderFile, 'utf8');
builderCode = builderCode.replace(
  "import { getProjects, getPhases, getDocumentBlocks, initializeDefaultBlocks, updateDocumentBlock, addDocumentBlock, deleteDocumentBlock, getTeamMembers, getCategories, getAllocations, getProjectCosts } from '@/lib/firebase/db';",
  "import { getProjects, getPhases, getDocumentBlocks, initializeDefaultBlocks, updateDocumentBlock, addDocumentBlock, deleteDocumentBlock, getTeamMembers, getCategories, getAllocations, getProjectCosts, getPayments } from '@/lib/firebase/db';"
);
if (!builderCode.includes('import { Payment }')) {
  builderCode = builderCode.replace(
    "import { Project, Phase, DocumentBlock, Allocation, ProjectCost, TeamMember, TeamCategory } from '@/lib/firebase/schema';",
    "import { Project, Phase, DocumentBlock, Allocation, ProjectCost, TeamMember, TeamCategory, Payment } from '@/lib/firebase/schema';"
  );
}
if (!builderCode.includes('const [payments, setPayments]')) {
  builderCode = builderCode.replace(
    'const [allocations, setAllocations] = useState<Allocation[]>([]);',
    'const [allocations, setAllocations] = useState<Allocation[]>([]);\n  const [payments, setPayments] = useState<Payment[]>([]);'
  );
}

const loadDataStr = `
  const loadProjectData = async (projectId: string) => {
    const p = await getPhases(projectId);
    setPhases(p.sort((a, b) => a.order - b.order));
    const b = await getDocumentBlocks(dbCompany!.id!, projectId);
    setBlocks(b);
    const pay = await getPayments(projectId);
    setPayments(pay.sort((a, b) => a.order - b.order));
  };
`;
builderCode = builderCode.replace(
  /const loadProjectData = async \(projectId: string\) => \{[\s\S]*?setBlocks\(b\);\n  \};/,
  loadDataStr.trim()
);

builderCode = builderCode.replace(
  "title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : 'Project Scope',",
  "title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : type === 'payment_schedule' ? 'Payment Schedule' : 'Project Scope',"
);

builderCode = builderCode.replace(
  'project={projects.find(p => p.id === activeProjectId)!}',
  'project={projects.find(p => p.id === activeProjectId)!}\n                        payments={payments}'
);
builderCode = builderCode.replace(
  'await exportToDocx(project, blocks, phases, allocations, costs, members, categories);',
  'await exportToDocx(project, blocks, phases, allocations, costs, members, categories, payments);'
);

fs.writeFileSync(builderFile, builderCode);


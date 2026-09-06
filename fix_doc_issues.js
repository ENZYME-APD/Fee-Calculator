const fs = require('fs');

// 1. Fix DocumentBuilder.tsx Layout and Insert logic
const builderFile = 'src/components/documents/DocumentBuilder.tsx';
let builderCode = fs.readFileSync(builderFile, 'utf8');

// Fix Layout: remove justify-center, use mx-auto
builderCode = builderCode.replace(
  'className="flex-1 overflow-y-auto p-8 flex justify-center print:p-0 print:bg-white bg-slate-100 dark:bg-slate-950"',
  'className="flex-1 overflow-y-auto p-8 print:p-0 print:bg-white bg-slate-100 dark:bg-slate-950"'
);
builderCode = builderCode.replace(
  'className="w-full max-w-[850px] bg-white dark:bg-slate-900 print:shadow-none shadow-xl border border-slate-200 dark:border-slate-800 min-h-[1100px] p-16 print:p-0 relative"',
  'className="w-full max-w-[850px] mx-auto bg-white dark:bg-slate-900 print:shadow-none shadow-xl border border-slate-200 dark:border-slate-800 min-h-[1100px] p-16 print:p-0 relative"'
);

// Remove the absolute right + button
builderCode = builderCode.replace(
  /<div className="print:hidden absolute -right-20 top-16 flex flex-col gap-3">[\s\S]*?<\/div>/,
  ''
);

// Add handleInsertBlock
const insertFn = `
  const handleInsertBlock = async (type: DocumentBlock['type'], afterIndex: number) => {
    if (!activeProjectId || !dbCompany) return;
    
    // Create new block
    const newBlock: Omit<DocumentBlock, 'id'> = {
      companyId: dbCompany.id!,
      projectId: activeProjectId,
      type,
      title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : 'Project Scope',
      content: type === 'rich_text' ? '<p>Enter text here...</p>' : '',
      order: afterIndex
    };
    
    const id = await addDocumentBlock(newBlock);
    const blockWithId = { ...newBlock, id };
    
    // Shift all subsequent blocks order + 1
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex, 0, blockWithId);
    
    const updatedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(updatedBlocks);
    
    // Update DB for shifted blocks
    const promises = updatedBlocks.slice(afterIndex).map(b => updateDocumentBlock(b.id!, { order: b.order }));
    await Promise.all(promises);
  };
`;
builderCode = builderCode.replace(
  'const handleDeleteBlock = async (id: string) => {',
  insertFn + '\n  const handleDeleteBlock = async (id: string) => {'
);

// Update SortableBlock props in map
builderCode = builderCode.replace(
  'onDelete={() => handleDeleteBlock(block.id!)}',
  'onDelete={() => handleDeleteBlock(block.id!)}\n                      onInsert={(type) => handleInsertBlock(type, index + 1)}'
);
// We need the index in the map
builderCode = builderCode.replace(
  '{blocks.map(block => (',
  '{blocks.map((block, index) => ('
);

fs.writeFileSync(builderFile, builderCode);

// 2. Fix SortableBlock.tsx
const blockFile = 'src/components/documents/SortableBlock.tsx';
let blockCode = fs.readFileSync(blockFile, 'utf8');

// Update interface
blockCode = blockCode.replace(
  'onDelete: () => void;',
  'onDelete: () => void;\n  onInsert: (type: DocumentBlock["type"]) => void;'
);

// Update function signature
blockCode = blockCode.replace(
  'project, onUpdate, onDelete }: SortableBlockProps)',
  'project, onUpdate, onDelete, onInsert }: SortableBlockProps)'
);

// Add Insert Button UI at the bottom of the block
const insertUI = `
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 print:hidden flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Add</span>
        <button onClick={() => onInsert('rich_text')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Text"><FileText size={14} /></button>
        <button onClick={() => onInsert('financial_summary')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Financials"><Calculator size={14} /></button>
        <button onClick={() => onInsert('team_breakdown')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Team"><Users size={14} /></button>
      </div>
`;
blockCode = blockCode.replace(
  '{renderContent()}\n    </div>',
  '{renderContent()}\n' + insertUI + '    </div>'
);
// Make sure FileText, Calculator, Users are imported in SortableBlock
if (!blockCode.includes('FileText')) {
  blockCode = blockCode.replace(
    "import { GripVertical, Trash2 } from 'lucide-react';",
    "import { GripVertical, Trash2, FileText, Calculator, Users } from 'lucide-react';"
  );
}

// Fix Team Allocation filtering
blockCode = blockCode.replace(
  'const memberAllocations = allocations.filter(a => a.memberId === member.id);',
  'const memberAllocations = allocations.filter(a => a.memberId === member.id && a.projectId === project.id);'
);

// Fix docxExport.ts Team Allocation filtering as well
const docxFile = 'src/lib/utils/docxExport.ts';
let docxCode = fs.readFileSync(docxFile, 'utf8');
docxCode = docxCode.replace(
  'const memberAllocations = allocations.filter(a => a.memberId === member.id);',
  'const memberAllocations = allocations.filter(a => a.memberId === member.id && a.projectId === project.id);'
);
fs.writeFileSync(docxFile, docxCode);

fs.writeFileSync(blockFile, blockCode);


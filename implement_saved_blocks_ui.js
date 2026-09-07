const fs = require('fs');

// 1. Update SortableBlock.tsx
const blockFile = 'src/components/documents/SortableBlock.tsx';
let blockCode = fs.readFileSync(blockFile, 'utf8');

if (!blockCode.includes('Save as Template')) {
  // Add Bookmark icon
  blockCode = blockCode.replace(
    "import { GripVertical, Trash2, FileText, Calculator, Users, CreditCard } from 'lucide-react';",
    "import { GripVertical, Trash2, FileText, Calculator, Users, CreditCard, BookmarkPlus } from 'lucide-react';"
  );

  // Add onSaveTemplate to props
  blockCode = blockCode.replace(
    '  onInsert: (type: DocumentBlock[\'type\']) => void;\n}',
    '  onInsert: (type: DocumentBlock[\'type\']) => void;\n  onSaveTemplate: (block: DocumentBlock, currentContent: string, currentTitle: string) => void;\n}'
  );

  blockCode = blockCode.replace(
    'payments, project, onUpdate, onDelete, onInsert }: SortableBlockProps) {',
    'payments, project, onUpdate, onDelete, onInsert, onSaveTemplate }: SortableBlockProps) {'
  );

  // Add button next to delete
  const newButtons = `
      <div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex gap-1">
        <button onClick={() => onSaveTemplate(block, editor ? editor.getHTML() : block.content, title)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Save as Template">
          <BookmarkPlus size={16} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors" title="Delete Block">
          <Trash2 size={16} />
        </button>
      </div>
  `;

  blockCode = blockCode.replace(
    /<div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">[\s\S]*?<\/div>/,
    newButtons.trim()
  );

  fs.writeFileSync(blockFile, blockCode);
}

// 2. Update DocumentBuilder.tsx
const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

if (!docCode.includes('saved_blocks')) {
  // Imports
  docCode = docCode.replace(
    "import { getProjects, getPhases, getDocumentBlocks, initializeDefaultBlocks, updateDocumentBlock, addDocumentBlock, deleteDocumentBlock, getTeamMembers, getCategories, getAllocations, getProjectCosts, getPayments } from '@/lib/firebase/db';",
    "import { getProjects, getPhases, getDocumentBlocks, initializeDefaultBlocks, updateDocumentBlock, addDocumentBlock, deleteDocumentBlock, getTeamMembers, getCategories, getAllocations, getProjectCosts, getPayments, getSavedBlocks, addSavedBlock, deleteSavedBlock } from '@/lib/firebase/db';"
  );

  docCode = docCode.replace(
    "import { Project, Phase, DocumentBlock, Allocation, ProjectCost, TeamMember, TeamCategory, Payment } from '@/lib/firebase/schema';",
    "import { Project, Phase, DocumentBlock, Allocation, ProjectCost, TeamMember, TeamCategory, Payment, SavedBlock } from '@/lib/firebase/schema';"
  );
  
  docCode = docCode.replace(
    "import { Folder, FileText, Printer, LayoutTemplate, Copy } from 'lucide-react';",
    "import { Folder, FileText, Printer, LayoutTemplate, Copy, Bookmark, Trash2, Plus } from 'lucide-react';"
  );

  // State
  docCode = docCode.replace(
    'const [payments, setPayments] = useState<Payment[]>([]);',
    'const [payments, setPayments] = useState<Payment[]>([]);\n  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([]);'
  );

  // Load Templates
  const loadTemplatesStr = `
  useEffect(() => {
    if (dbCompany?.id) {
      getSavedBlocks(dbCompany.id).then(setSavedBlocks).catch(console.error);
    }
  }, [dbCompany?.id]);
  `;
  docCode = docCode.replace(
    'useEffect(() => {\n    if (projects.length > 0 && !activeProjectId) {',
    loadTemplatesStr + '\n  useEffect(() => {\n    if (projects.length > 0 && !activeProjectId) {'
  );

  // Save Template Handler
  const saveTemplateStr = `
  const handleSaveTemplate = async (block: DocumentBlock, currentContent: string, currentTitle: string) => {
    if (!dbCompany?.id) return;
    const name = window.prompt("Enter a name for this template:", currentTitle);
    if (!name) return;
    
    const newTemplate: Omit<SavedBlock, 'id'> = {
      companyId: dbCompany.id,
      templateName: name,
      type: block.type,
      title: currentTitle,
      content: currentContent
    };
    
    try {
      const id = await addSavedBlock(newTemplate);
      setSavedBlocks([...savedBlocks, { ...newTemplate, id }]);
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save template');
    }
  };

  const handleInsertTemplate = async (template: SavedBlock) => {
    if (!dbCompany?.id || !activeProjectId) return;
    
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order), -1);
    
    const newBlock: Partial<DocumentBlock> = {
      projectId: activeProjectId,
      type: template.type,
      title: template.title,
      content: template.content,
      order: maxOrder + 1
    };
    
    try {
      const id = await addDocumentBlock(newBlock as Omit<DocumentBlock, 'id'>);
      setBlocks([...blocks, { ...newBlock, id } as DocumentBlock]);
      toast.success('Template inserted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to insert template');
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteSavedBlock(id);
        setSavedBlocks(savedBlocks.filter(b => b.id !== id));
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete template');
      }
    }
  };
  `;
  docCode = docCode.replace(
    'const handleInsertBlock = async (type: DocumentBlock[\'type\'], afterIndex: number) => {',
    saveTemplateStr + '\n  const handleInsertBlock = async (type: DocumentBlock[\'type\'], afterIndex: number) => {'
  );

  // Update SortableBlock props
  docCode = docCode.replace(
    'onInsert={(type) => handleInsertBlock(type, index)}',
    'onInsert={(type) => handleInsertBlock(type, index)}\n                        onSaveTemplate={handleSaveTemplate}'
  );

  // UI Split
  const sidebarContent = `
        {/* Project Selector (Top Half) */}
        <div className="flex flex-col h-1/2 border-b border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Folder size={18} className="text-blue-500" />
              Proposals
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setActiveProjectId(project.id!)}
                className={\`w-full text-left px-4 py-3 rounded-xl transition-all \${activeProjectId === project.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm border border-blue-100 dark:border-blue-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}\`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{project.name}</span>
                  {activeProjectId === project.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Library (Bottom Half) */}
        <div className="flex flex-col h-1/2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bookmark size={18} className="text-emerald-500" />
              Saved Templates
            </h3>
            <p className="text-xs text-slate-500 mt-1">Click to append to document</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {savedBlocks.length === 0 ? (
              <div className="text-center p-4 text-sm text-slate-400">
                No templates saved yet. Click the bookmark icon on any block to save it.
              </div>
            ) : (
              savedBlocks.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleInsertTemplate(template)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{template.templateName}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{template.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Insert Template">
                      <Plus size={14} />
                    </div>
                    <div onClick={(e) => handleDeleteTemplate(template.id!, e)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors" title="Delete Template">
                      <Trash2 size={14} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
  `;

  // Remove the old Project Sidebar and replace with the new split layout
  docCode = docCode.replace(
    /<div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full print:hidden">[\s\S]*?<\/div>[\s\S]*?<div className="flex-1 flex flex-col h-full relative print:block">/,
    '<div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full print:hidden">' + sidebarContent + '</div>\n      {/* Main Content Area */}\n      <div className="flex-1 flex flex-col h-full relative print:block">'
  );

  fs.writeFileSync(docFile, docCode);
}

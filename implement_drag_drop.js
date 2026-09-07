const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

// Imports
if (!docCode.includes('DragOverlay')) {
  docCode = docCode.replace(
    "import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';",
    "import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDraggable, DragOverlay } from '@dnd-kit/core';"
  );
}

// Add SidebarTemplateItem component at the top (outside DocumentBuilder)
const sidebarItemComp = `
function SidebarTemplateItem({ template, onInsert, onDelete }: { template: SavedBlock, onInsert: () => void, onDelete: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: \`template-\${template.id}\`,
    data: { type: 'template', template }
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onInsert}
      className={\`w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-grab active:cursor-grabbing group flex items-start justify-between \${isDragging ? 'opacity-50 ring-2 ring-emerald-500' : ''}\`}
    >
      <div className="flex flex-col overflow-hidden pointer-events-none">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{template.templateName}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{template.type.replace('_', ' ')}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Drag or Click to Insert">
          <Plus size={14} />
        </div>
        <div onPointerDown={(e) => e.stopPropagation()} onClick={onDelete} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors" title="Delete Template">
          <Trash2 size={14} />
        </div>
      </div>
    </div>
  );
}
`;

if (!docCode.includes('SidebarTemplateItem')) {
  docCode = docCode.replace(
    'export function DocumentBuilder() {',
    sidebarItemComp + '\nexport function DocumentBuilder() {'
  );
}

// State for activeDragId
if (!docCode.includes('activeDragId')) {
  docCode = docCode.replace(
    '  const [payments, setPayments] = useState<Payment[]>([]);',
    '  const [payments, setPayments] = useState<Payment[]>([]);\n  const [activeDragId, setActiveDragId] = useState<string | null>(null);'
  );
}


// Rewrite handleDragEnd and add handleDragStart
const dragHandlers = `
  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || !activeProjectId || !dbCompany) return;

    if (active.data.current?.type === 'template') {
      const template = active.data.current.template as SavedBlock;
      let targetIndex = blocks.findIndex((b) => b.id === over.id);
      if (targetIndex === -1) targetIndex = blocks.length;
      
      const newBlock: Partial<DocumentBlock> = {
        companyId: dbCompany.id!,
        projectId: activeProjectId,
        type: template.type,
        title: template.title,
        content: template.content,
        order: targetIndex
      };
      
      // Shift other blocks down
      const newBlocks = [...blocks];
      newBlocks.splice(targetIndex, 0, newBlock as DocumentBlock);
      const orderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
      
      try {
        const id = await addDocumentBlock(newBlock as Omit<DocumentBlock, 'id'>);
        const savedBlock = { ...orderedBlocks[targetIndex], id };
        orderedBlocks[targetIndex] = savedBlock;
        setBlocks(orderedBlocks as DocumentBlock[]);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template inserted!' } }));
        
        const promises = orderedBlocks.map(b => updateDocumentBlock(b.id!, { order: b.order }));
        await Promise.all(promises);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));
      
      setBlocks(newBlocks);
      
      const promises = newBlocks.map((b) => updateDocumentBlock(b.id!, { order: b.order }));
      await Promise.all(promises);
    }
  };
`;

docCode = docCode.replace(
  /const handleDragEnd = async \(event: any\) => \{[\s\S]*?^\s*\};/m,
  dragHandlers
);


// Move DndContext to wrap everything
// It's currently at line `<DndContext \n sensors={sensors}\n collisionDetection={closestCenter}\n onDragEnd={handleDragEnd}\n >`
// Let's remove it from there and add it to the root return.
const dndContextStartRegex = /<DndContext[\s\S]*?onDragEnd=\{handleDragEnd\}\s*>/;
docCode = docCode.replace(dndContextStartRegex, '');
docCode = docCode.replace(/<\/DndContext>/, '');

// Now wrap the root div
docCode = docCode.replace(
  '<div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">',
  `<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">`
);

const endDivRegex = /    <\/div>\n  \);\n}/;
docCode = docCode.replace(
  endDivRegex,
  `    </div>
    <DragOverlay>
      {activeDragId && activeDragId.toString().startsWith('template-') ? (
        <div className="w-64 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500 shadow-2xl opacity-90 cursor-grabbing">
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">Dragging Template...</span>
          </div>
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
}`
);


// Use SidebarTemplateItem instead of direct div
const oldTemplateRender = /savedBlocks\.map\(template => \([\s\S]*?\)\)/;
const newTemplateRender = `savedBlocks.map(template => (
                <SidebarTemplateItem
                  key={template.id}
                  template={template}
                  onInsert={() => handleInsertTemplate(template)}
                  onDelete={(e) => handleDeleteTemplate(template.id!, e)}
                />
              ))`;
docCode = docCode.replace(oldTemplateRender, newTemplateRender);


fs.writeFileSync(docFile, docCode);

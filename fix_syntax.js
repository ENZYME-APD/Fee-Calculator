const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

// Undo the mess inside SidebarTemplateItem
const brokenSidebarRegex = /    <\/div>\n    <DragOverlay>[\s\S]*?<\/DndContext>\n  \);\n\}/;
docCode = docCode.replace(brokenSidebarRegex, '    </div>\n  );\n}');

// Now correctly append it to the end of DocumentBuilder
const lastEndDivRegex = /    <\/div>\n  \);\n}\s*$/;
docCode = docCode.replace(
  lastEndDivRegex,
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

fs.writeFileSync(docFile, docCode);

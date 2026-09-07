const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

// The replacement in the previous script failed because of the regex. 
// Let's do it using string split/slice or simpler regex.

const startMarker = '<div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full print:hidden">';
const endMarker = '<div className="flex-1 flex flex-col h-full relative">';

if (docCode.includes(startMarker) && docCode.includes(endMarker)) {
  const startIndex = docCode.indexOf(startMarker);
  const endIndex = docCode.indexOf(endMarker);
  
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
            {projects.filter(p => !p.isTemplate).map(project => (
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
      </div>
`;
  
  docCode = docCode.substring(0, startIndex) + startMarker + sidebarContent + endMarker + docCode.substring(endIndex + endMarker.length);
  fs.writeFileSync(docFile, docCode);
}

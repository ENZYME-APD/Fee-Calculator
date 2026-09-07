const fs = require('fs');

function updateFile(file) {
    let code = fs.readFileSync(file, 'utf8');

    // 1. Add state showLost
    if (!code.includes('showLost')) {
        code = code.replace(
            /const \[activeProjectId, setActiveProjectId\] = useState<string \| null>\(initialProjectId \|\| null\);/,
            'const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId || null);\n  const [showLost, setShowLost] = useState(false);'
        );
    }
    
    // 2. Add lucide import for Eye/EyeOff if not present
    if (code.includes("import {") && !code.includes("EyeOff")) {
        code = code.replace(/Folder,/, 'Folder, Eye, EyeOff,');
    }

    // 3. Update the filter
    const targetFilter = 'projects.filter(p => !p.isTemplate)';
    const newFilter = 'projects.filter(p => !p.isTemplate && (showLost || p.status !== "Lost"))';
    if (code.includes(targetFilter)) {
        code = code.replace(targetFilter, newFilter);
    }

    // 4. Add the toggle button to the header
    const toggleButton = `
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a project</p>
            <button 
              onClick={() => setShowLost(!showLost)} 
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
            >
              {showLost ? <EyeOff size={12} /> : <Eye size={12} />}
              {showLost ? 'Hide Lost' : 'Show Lost'}
            </button>
          </div>
    `;
    
    // In GanttPlanner:
    if (code.includes('<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a project to plan tasks</p>')) {
        code = code.replace(
            '<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a project to plan tasks</p>',
            toggleButton
        );
    }
    
    // In DocumentBuilder (very similar structure):
    if (code.includes('<p className="text-xs text-slate-500 mt-1">Click to append to document</p>')) {
        // Find the top section which is for projects
        if (code.includes('<h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">\n              <Folder size={18} className="text-blue-500" />\n              Proposals\n            </h3>')) {
            code = code.replace(
                /<h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">\s*<Folder size=\{18\} className="text-blue-500" \/>\s*Proposals\s*<\/h3>/,
                '<h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">\n              <Folder size={18} className="text-blue-500" />\n              Proposals\n            </h3>' + toggleButton
            );
        }
    }

    fs.writeFileSync(file, code);
}

updateFile('src/components/planning/GanttPlanner.tsx');
updateFile('src/components/documents/DocumentBuilder.tsx');


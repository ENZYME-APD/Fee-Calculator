const fs = require('fs');

const wikiFile = 'src/components/wiki/WikiContent.tsx';
let wikiCode = fs.readFileSync(wikiFile, 'utf8');

// Update Planner section
const newPlannerContent = `                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Generating Tasks</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-3">
                    When you first open a project in the Planner, you can click <strong className="text-blue-600 dark:text-blue-400">Sync Budget</strong> to instantly create tasks for every team member allocated in the Fee Calculator, distributed across the correct phases.
                    <br /><br />
                    If you manually change task durations and want to reset your schedule to match your budget perfectly, click the new <strong className="text-rose-600 dark:text-rose-400">Reset to Budget</strong> button next to the Sync button.
                  </p>`;
wikiCode = wikiCode.replace(
  /<h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Generating Tasks<\/h3>[\s\S]*?<\/p>/,
  newPlannerContent
);

// Update Document Builder section
const newDocBuilderContent = `                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <Bookmark size={14} className="text-emerald-500" />
                      Saved Templates
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Save any text block as a template by clicking its bookmark icon. Your templates appear in the left sidebar and can be dragged and dropped directly into your proposals!
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <Download size={14} className="text-slate-400" />
                      Export to Word & PDF
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Download a native Microsoft Word <code>.docx</code> document or a beautiful multi-page PDF to send directly to your clients.
                    </p>`;

wikiCode = wikiCode.replace(
  /<h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">[\s]*<Download size=\{14\} className="text-slate-400" \/>[\s]*Export to Word[\s]*<\/h4>[\s\S]*?<\/p>/,
  newDocBuilderContent
);

// Add Phase Template section to Project Templates
const newTemplateContent = `<div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Rich Phase Definitions</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Click the pencil icon on any Phase to open the Phase Settings Modal. Pre-define Tasks, Deliverables, Inclusions, and Omissions so they're ready to go for every new project.
                    </p>
                  </div>`;

wikiCode = wikiCode.replace(
  /(<div id="templates"[\s\S]*?<\/p>\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\s*<div.*?<\/div>)/,
  `$1\n                  ${newTemplateContent}`
);

fs.writeFileSync(wikiFile, wikiCode);

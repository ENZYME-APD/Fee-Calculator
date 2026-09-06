const fs = require('fs');
const file = 'src/components/wiki/WikiContent.tsx';
let code = fs.readFileSync(file, 'utf8');

const newSection = `
          {/* Section: Project Planning */}
          <div id="project-planning" className="pt-24 -mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <CalendarCheck className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Project Planning & Timeline</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                The <strong className="text-slate-800 dark:text-slate-200">Project Planning</strong> feature allows you to translate your estimated fee hours into a concrete schedule on a timeline.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Generating Tasks</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-3">
                    When you first open a project in the Planner, you can click <strong className="text-blue-600 dark:text-blue-400">Auto-Generate Timeline</strong> to instantly create tasks for every team member allocated in the Fee Calculator, distributed across the correct phases.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <GripHorizontal size={14} className="text-slate-400" />
                      Interactive Gantt
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Drag tasks left and right to change their start date. Drag the edges to extend or reduce their duration. Click the edit icon to manually change dates or skip weekends.
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <Calculator size={14} className="text-slate-400" />
                      Budget Syncing
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      The planner header compares your planned hours against the budget from the Fee Proposal. Click the <strong className="text-emerald-500">Sync Budget</strong> button to overwrite the Fee Proposal with your exact planned hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
`;

code = code.replace(
  '{/* Section 6: Financial Summary */}',
  newSection + '\n          {/* Section 6: Financial Summary */}'
);

fs.writeFileSync(file, code);

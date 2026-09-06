const fs = require('fs');
const file = 'src/components/planning/GanttGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add explicitlyAddedMembers state and logic
code = code.replace(
  "export function GanttGrid({ project, phases, members, allocations, tasks, onTaskCreate, onTaskUpdate, onTaskDelete }: GanttGridProps) {",
  `export function GanttGrid({ project, phases, members, allocations, tasks, onTaskCreate, onTaskUpdate, onTaskDelete }: GanttGridProps) {
  const [addedMemberIds, setAddedMemberIds] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);`
);

// Update projectMembers derivation
const oldDerivation = `const projectMemberIds = Array.from(new Set(allocations.map(a => a.memberId)));
  const projectMembers = members.filter(m => projectMemberIds.includes(m.id!));`;

const newDerivation = `const projectMemberIds = Array.from(new Set([
    ...allocations.map(a => a.memberId),
    ...tasks.filter(t => t.memberId).map(t => t.memberId!),
    ...addedMemberIds
  ]));
  const projectMembers = members.filter(m => projectMemberIds.includes(m.id!));
  const availableMembersToAdd = members.filter(m => !projectMemberIds.includes(m.id!));`;
  
code = code.replace(oldDerivation, newDerivation);

// 2. Fix the Edit button
const oldEditBtn = `{/* Edit Button */}
                      {!isDraggingThis && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          className="absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-600 dark:text-slate-300 opacity-0 group-hover/task:opacity-100 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 z-50 cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}`;
const newEditBtn = `{/* Edit Button */}
                      {!isDraggingThis && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          className="w-5 h-5 ml-auto bg-black/10 rounded flex items-center justify-center opacity-0 group-hover/task:opacity-100 hover:bg-black/20 transition-all cursor-pointer z-50 shrink-0"
                        >
                          <Edit2 size={10} className="text-white" />
                        </button>
                      )}`;
code = code.replace(oldEditBtn, newEditBtn);

// 3. Add Team Member Button UI
const oldLeftColumn = `</div>
              </div>

              {/* Grid Cells Container */}`;
const newLeftColumn = `</div>
              </div>

              {/* Grid Cells Container */}`;
// Wait, we need to add the button at the END of the projectMembers map
const leftColReplacement = `</div>
          ))}
          
          {/* Add Team Member Button */}
          <div className="w-64 shrink-0 sticky left-0 z-20 bg-slate-50/50 dark:bg-slate-900/30 border-r border-b border-slate-200 dark:border-slate-800 flex flex-col p-2 box-border min-h-[64px] justify-center shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
            {!showAddMember ? (
              <button 
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <Plus size={16} /> Add Team Member
              </button>
            ) : (
              <select 
                className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    setAddedMemberIds(prev => [...prev, e.target.value]);
                    setShowAddMember(false);
                  }
                }}
                onBlur={() => setShowAddMember(false)}
                autoFocus
              >
                <option value="">Select a member...</option>
                {availableMembersToAdd.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role || m.position})</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>`;

code = code.replace(/<\/div>\n          \)\)\}\n        <\/div>\n      <\/div>/, leftColReplacement);

// 4. Auto-Generate Timeline Banner
const autoGenerateLogic = `
  const handleAutoGenerate = () => {
    // For each allocation, generate a task in that phase
    allocations.forEach(alloc => {
      if (alloc.hours <= 0) return;
      
      const phase = phaseTimeline.find(p => p.id === alloc.phaseId);
      if (!phase) return;

      onTaskCreate({
        projectId: project.id!,
        phaseId: alloc.phaseId,
        memberId: alloc.memberId,
        name: phase.name + ' Work',
        description: 'Auto-generated from fee proposal',
        startDate: phase.startDate.getTime(),
        durationHours: alloc.hours,
        includeWeekends: false
      });
    });
  };
`;

code = code.replace(
  "const handleCellClick",
  autoGenerateLogic + "\n  const handleCellClick"
);

const autoGenBanner = `
      {tasks.length === 0 && allocations.length > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <h4 className="font-bold">Generate Timeline?</h4>
            <p className="text-sm text-blue-100">Automatically create tasks from budgeted hours.</p>
          </div>
          <button 
            onClick={handleAutoGenerate}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Auto-Generate
          </button>
        </div>
      )}
`;

code = code.replace(
  "{/* Header Row */}",
  autoGenBanner + "\n          {/* Header Row */}"
);

fs.writeFileSync(file, code);

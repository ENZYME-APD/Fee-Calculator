const fs = require('fs');

// Patch GanttGrid
const fileGrid = 'src/components/planning/GanttGrid.tsx';
let codeGrid = fs.readFileSync(fileGrid, 'utf8');

codeGrid = codeGrid.replace(
  "import { Plus } from 'lucide-react';",
  "import { Plus, Edit2 } from 'lucide-react';\nimport { EditTaskModal } from './EditTaskModal';"
);

codeGrid = codeGrid.replace(
  "onTaskUpdate: (id: string, updates: Partial<ProjectTask>) => void;",
  "onTaskUpdate: (id: string, updates: Partial<ProjectTask>) => void;\n  onTaskDelete: (id: string) => void;"
);

codeGrid = codeGrid.replace(
  "export function GanttGrid({ project, phases, members, allocations, tasks, onTaskCreate, onTaskUpdate }: GanttGridProps) {",
  "export function GanttGrid({ project, phases, members, allocations, tasks, onTaskCreate, onTaskUpdate, onTaskDelete }: GanttGridProps) {\n  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);"
);

// We add the Edit button inside the task render block
const editBtnReplace = `{/* Resize Handle */}
                      <div 
                        className="absolute right-0 top-0 w-4 h-full cursor-col-resize opacity-0 group-hover/task:opacity-100 flex items-center justify-center"
                        onPointerDown={(e) => handlePointerDown(e, task, 'resize', displayLeft, displayWidth)}
                      >
                        <div className="w-1 h-4 bg-white/50 rounded-full pointer-events-none" />
                      </div>

                      {/* Edit Button */}
                      {!isDraggingThis && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          className="absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-600 dark:text-slate-300 opacity-0 group-hover/task:opacity-100 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 z-50 cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}`;
codeGrid = codeGrid.replace(/{ \/\* Resize Handle \*\/ \}[\s\S]*?(?=<\/div>\n                  );)/, editBtnReplace + '\n                    ');

// Render modal at the end
const modalRender = `
      {editingTask && (
        <EditTaskModal 
          task={editingTask}
          phases={phases}
          members={members}
          onClose={() => setEditingTask(null)}
          onSave={(id, updates) => {
            onTaskUpdate(id, updates);
            setEditingTask(null);
          }}
          onDelete={(id) => {
            onTaskDelete(id);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );`;
codeGrid = codeGrid.replace(/<\/div>\n  \);/, modalRender);

fs.writeFileSync(fileGrid, codeGrid);

// Patch GanttPlanner
const filePlanner = 'src/components/planning/GanttPlanner.tsx';
let codePlanner = fs.readFileSync(filePlanner, 'utf8');

codePlanner = codePlanner.replace(
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts } from '@/lib/firebase/db';",
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts, deleteProjectTask } from '@/lib/firebase/db';"
);

const deleteLogic = `
  const handleTaskDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteProjectTask(id);
  };
`;
codePlanner = codePlanner.replace(
  "const handleTaskUpdate = async",
  deleteLogic + "\n  const handleTaskUpdate = async"
);

codePlanner = codePlanner.replace(
  "onTaskUpdate={handleTaskUpdate}",
  "onTaskUpdate={handleTaskUpdate}\n                onTaskDelete={handleTaskDelete}"
);

fs.writeFileSync(filePlanner, codePlanner);

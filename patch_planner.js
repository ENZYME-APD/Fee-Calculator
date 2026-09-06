const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('deleteProjectTask')) {
  code = code.replace(
    "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts } from '@/lib/firebase/db';",
    "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts, deleteProjectTask } from '@/lib/firebase/db';"
  );
}

const deleteLogic = `
  const handleTaskDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteProjectTask(id);
  };
`;
if (!code.includes('handleTaskDelete')) {
  code = code.replace(
    "const handleTaskUpdate = async",
    deleteLogic + "\n  const handleTaskUpdate = async"
  );
  
  code = code.replace(
    "onTaskUpdate={handleTaskUpdate}",
    "onTaskUpdate={handleTaskUpdate}\n                onTaskDelete={handleTaskDelete}"
  );
}

fs.writeFileSync(file, code);

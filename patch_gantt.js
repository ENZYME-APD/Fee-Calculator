const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { getProjects, getPhases, getTeamMembers, getAllocations } from '@/lib/firebase/db';",
  "import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask } from '@/lib/firebase/db';"
);

code = code.replace(
  "import { Folder, CalendarDays, Lock } from 'lucide-react';",
  "import { Folder, CalendarDays, Lock } from 'lucide-react';\nimport { GanttGrid } from './GanttGrid';"
);

code = code.replace(
  "const [activeProjectId, setActiveProjectId] = useState<string | null>(null);",
  `const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);`
);

code = code.replace(
  "loadProjects();",
  `loadProjects();
    loadCompanyData();`
);

code = code.replace(
  "const loadProjects = async () => {",
  `const loadCompanyData = async () => {
    const [pMembers, pAllocations] = await Promise.all([
      getTeamMembers(),
      getAllocations()
    ]);
    setMembers(pMembers);
    setAllocations(pAllocations);
  };

  const loadProjects = async () => {`
);

let activeEffect = `
  useEffect(() => {
    if (activeProjectId) {
      loadProjectData(activeProjectId);
    }
  }, [activeProjectId]);

  const loadProjectData = async (projectId: string) => {
    const [pPhases, pTasks] = await Promise.all([
      getPhases(projectId),
      getProjectTasks(projectId)
    ]);
    setPhases(pPhases.sort((a,b) => a.order - b.order));
    setTasks(pTasks);
  };

  const handleTaskCreate = async (task: Omit<ProjectTask, 'id' | 'companyId'>) => {
    const tempTask = { ...task, id: 'temp-' + Date.now(), companyId: dbCompany?.id || '' };
    setTasks(prev => [...prev, tempTask as ProjectTask]);
    const id = await addProjectTask(task);
    setTasks(prev => prev.map(t => t.id === tempTask.id ? { ...t, id } : t));
  };

  const handleTaskUpdate = async (id: string, updates: Partial<ProjectTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await updateProjectTask(id, updates);
  };
`;

code = code.replace(
  "if (loading) return",
  activeEffect + "\n  if (loading) return"
);

code = code.replace(
  '<div className="p-8 flex items-center justify-center h-full text-slate-400">\n             <p>Gantt chart grid goes here...</p>\n           </div>',
  `<GanttGrid 
             project={projects.find(p => p.id === activeProjectId)!}
             phases={phases}
             members={members}
             allocations={allocations.filter(a => a.projectId === activeProjectId)}
             tasks={tasks}
             onTaskCreate={handleTaskCreate}
             onTaskUpdate={handleTaskUpdate}
           />`
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/projects/ProjectManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add imports
code = code.replace(
  "clearPhase, getUsersByCompany } from '@/lib/firebase/db';",
  "clearPhase, getUsersByCompany, getProjectCosts, getAllocations, getTeamMembers } from '@/lib/firebase/db';"
);
code = code.replace(
  "import { Project, Phase, User } from '@/lib/firebase/schema';",
  "import { Project, Phase, User, Allocation, ProjectCost, TeamMember } from '@/lib/firebase/schema';"
);

// 2. Add state
code = code.replace(
  "const [phases, setPhases] = useState<Phase[]>([]);",
  "const [phases, setPhases] = useState<Phase[]>([]);\n  const [allocations, setAllocations] = useState<Allocation[]>([]);\n  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);\n  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);"
);

// 3. Update loadPhases to also load other data
code = code.replace(
  "const loadPhases = async (projectId: string) => {",
  `const loadPhases = async (projectId: string) => {
    const pAllocations = await getAllocations();
    const pCosts = await getProjectCosts(projectId);
    const pMembers = await getTeamMembers();
    setAllocations(pAllocations.filter(a => a.projectId === projectId));
    setProjectCosts(pCosts);
    setTeamMembers(pMembers);`
);

// 4. Update the layout
// We need to wrap the last two columns
// "flex h-full gap-6 mx-auto w-full p-8"
// Column 1 is "flex-1 bg-white..."
// Column 2 is "flex-1 bg-white..." (Phases Manager)
// Column 3 is "<PaymentScheduleManager ... />"

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/projects/ProjectManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLoadPhases = `  const loadPhases = async (projectId: string) => {
    const pAllocations = await getAllocations();
    const pCosts = await getProjectCosts(projectId);
    const pMembers = await getTeamMembers();
    setAllocations(pAllocations.filter(a => a.projectId === projectId));
    setProjectCosts(pCosts);
    setTeamMembers(pMembers);
    const data = await getPhases(projectId);
    setPhases(data.sort((a, b) => a.order - b.order));
  };`;

const newLoadPhases = `  const loadPhases = async (projectId: string) => {
    const data = await getPhases(projectId);
    const sortedPhases = data.sort((a, b) => a.order - b.order);
    setPhases(sortedPhases);
    
    const phaseIds = sortedPhases.map(p => p.id);
    const pAllocations = await getAllocations();
    const pCosts = await getProjectCosts(projectId);
    const pMembers = await getTeamMembers();
    
    // Use the robust phaseId filtering method instead of projectId due to legacy DB mapping bug
    setAllocations(pAllocations.filter(a => phaseIds.includes(a.phaseId)));
    setProjectCosts(pCosts.filter(c => phaseIds.includes(c.phaseId)));
    setTeamMembers(pMembers);
  };`;

code = code.replace(oldLoadPhases, newLoadPhases);
fs.writeFileSync(file, code);

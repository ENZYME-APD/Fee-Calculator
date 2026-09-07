const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLoadProjectData = `  const loadProjectData = async (projectId: string) => {
    const [pPhases, pCosts, pTasks] = await Promise.all([
      getPhases(projectId),
      getProjectCosts(projectId),
      getProjectTasks(projectId)
    ]);
    
    const sortedPhases = pPhases.sort((a,b) => a.order - b.order);
    setPhases(sortedPhases);
    setProjectCosts(pCosts);
    
    // Auto-generate initial tasks if none exist but allocations do
    if (pTasks.length === 0 && allocations.length > 0) {
      const phaseIds = sortedPhases.map(p => p.id);
      const projectAllocations = allocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
      
      if (projectAllocations.length > 0) {
        setIsResetting(true);
        try {
          const createPromises = projectAllocations.map(a => {
            const newTask = {
              projectId: projectId,
              phaseId: a.phaseId,
              memberId: a.memberId,
              name: 'Planned Task',
              startDate: Date.now(),
              description: '',
              includeWeekends: false,
              durationHours: a.hours,
              order: 0
            };
            return addProjectTask(newTask);
          });
          await Promise.all(createPromises);
          const newTasks = await getProjectTasks(projectId);
          setTasks(newTasks);
        } catch (error) {
          console.error("Auto generation failed:", error);
          setTasks([]);
        } finally {
          setIsResetting(false);
        }
        return;
      }
    }
    
    setTasks(pTasks);
  };`;

const newLoadProjectData = `  const loadProjectData = async (projectId: string) => {
    const [pPhases, pCosts, pTasks, pAllocations] = await Promise.all([
      getPhases(projectId),
      getProjectCosts(projectId),
      getProjectTasks(projectId),
      getAllocations()
    ]);
    
    const sortedPhases = pPhases.sort((a,b) => a.order - b.order);
    setPhases(sortedPhases);
    setProjectCosts(pCosts);
    
    // Auto-generate initial tasks if none exist but allocations do
    if (pTasks.length === 0 && pAllocations.length > 0) {
      const phaseIds = sortedPhases.map(p => p.id);
      const projectAllocations = pAllocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
      
      if (projectAllocations.length > 0) {
        setIsResetting(true);
        try {
          const createPromises = projectAllocations.map(a => {
            const newTask = {
              projectId: projectId,
              phaseId: a.phaseId,
              memberId: a.memberId,
              name: 'Planned Task',
              startDate: Date.now(),
              description: '',
              includeWeekends: false,
              durationHours: a.hours,
              order: 0
            };
            return addProjectTask(newTask);
          });
          await Promise.all(createPromises);
          const newTasks = await getProjectTasks(projectId);
          setTasks(newTasks);
        } catch (error) {
          console.error("Auto generation failed:", error);
          setTasks([]);
        } finally {
          setIsResetting(false);
        }
        return;
      }
    }
    
    setTasks(pTasks);
  };`;

code = code.replace(oldLoadProjectData, newLoadProjectData);
fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

const syncFunc = `  const handleSyncBudget = async () => {
    if (!activeProjectId || !dbCompany) return;
    setIsSyncing(true);
    
    const plannedAllocations: Record<string, number> = {};
    tasks.forEach(task => {
        const key = \`\${task.phaseId}_\${task.memberId}\`;
        plannedAllocations[key] = (plannedAllocations[key] || 0) + task.durationHours;
    });

    const projectPhases = phases.filter(p => p.projectId === activeProjectId);
    const phaseIds = projectPhases.map(p => p.id);
    const projectAllocations = allocations.filter(a => phaseIds.includes(a.phaseId));
    
    const promises = [];
    
    for (const key in plannedAllocations) {
        const [phaseId, memberId] = key.split('_');
        const plannedHours = plannedAllocations[key];
        
        const existing = projectAllocations.find(a => a.phaseId === phaseId && a.memberId === memberId);
        
        if (existing) {
            if (existing.hours !== plannedHours) {
                promises.push(updateAllocation(existing.id!, { hours: plannedHours }));
            }
        } else {
            promises.push(addAllocation({ projectId: activeProjectId, phaseId, memberId, hours: plannedHours, allocationType: 'total_hours', allocationValue: plannedHours }));
        }
    }
    
    for (const existing of projectAllocations) {
        const key = \`\${existing.phaseId}_\${existing.memberId}\`;
        if (!plannedAllocations[key] && existing.hours > 0) {
            promises.push(updateAllocation(existing.id!, { hours: 0 }));
        }
    }
    
    await Promise.all(promises);
    const updatedAllocations = await getAllocations();
    setAllocations(updatedAllocations);
    setIsSyncing(false);
  };`;

// Find handleSyncBudget block and replace it
const startIdx = code.indexOf('  const handleSyncBudget = async () => {');
if (startIdx !== -1) {
    const endIdx = code.indexOf('  return (', startIdx);
    code = code.substring(0, startIdx) + syncFunc + '\n' + code.substring(endIdx);
}

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `const projectAllocs = allocations.filter(a => a.projectId === activeProjectId);
               
               const budgetedCost = projectAllocs.reduce((sum, a) => sum + (a.hours * (members.find(m => m.id === a.memberId)?.costPerHour || 0)), 0) + 
                  projectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);`;

const replacement = `const projectPhases = phases.filter(p => p.projectId === activeProjectId);
               const phaseIds = projectPhases.map(p => p.id);
               const projectAllocs = allocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
               const validProjectCosts = projectCosts.filter(c => phaseIds.includes(c.phaseId));
               
               const budgetedCost = projectAllocs.reduce((sum, a) => sum + (a.hours * (members.find(m => m.id === a.memberId)?.costPerHour || 0)), 0) + 
                  validProjectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Success");
} else {
  console.log("Target not found");
}


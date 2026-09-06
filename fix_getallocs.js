const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/getAllocations\(dbCompany\.id\)/g, 'getAllocations()');
code = code.replace(/addAllocation\(\{ projectId/g, 'addAllocation({ projectId'); // missing type?
// Wait, addAllocation expects Omit<Allocation, 'id'|'companyId'>
// Which means it needs: projectId, phaseId, memberId, hours, allocationType, allocationValue
// In GanttPlanner.tsx, I used: addAllocation({ projectId: activeProjectId, phaseId, memberId, hours: plannedHours })
// allocationType is missing. Let's add it.
code = code.replace(/addAllocation\(\{ projectId: activeProjectId, phaseId, memberId, hours: plannedHours \}\)/g, "addAllocation({ projectId: activeProjectId, phaseId, memberId, hours: plannedHours, allocationType: 'total_hours', allocationValue: plannedHours })");

fs.writeFileSync(file, code);

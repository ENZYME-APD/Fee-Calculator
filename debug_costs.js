const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const projectsSnap = await db.collection('projects').where('name', '==', 'CASA DIEGO BUSTO').get();
  if (projectsSnap.empty) {
    console.log("Project not found");
    return;
  }
  const project = projectsSnap.docs[0];
  const projectId = project.id;
  const companyId = project.data().companyId;
  console.log("Project:", projectId, companyId);
  
  const phasesSnap = await db.collection('phases').where('projectId', '==', projectId).get();
  const phaseIds = phasesSnap.docs.map(d => d.id);
  console.log("Phases count:", phaseIds.length);
  
  const allocsSnap = await db.collection('allocations').where('projectId', '==', projectId).get();
  let allocs = [];
  allocsSnap.forEach(d => allocs.push({id: d.id, ...d.data()}));
  console.log("Allocations count:", allocs.length);
  
  const tasksSnap = await db.collection('project_tasks').where('projectId', '==', projectId).get();
  let tasks = [];
  tasksSnap.forEach(d => tasks.push({id: d.id, ...d.data()}));
  console.log("Tasks count:", tasks.length);
  
  const membersSnap = await db.collection('team_members').where('companyId', '==', companyId).get();
  let members = {};
  membersSnap.forEach(d => members[d.id] = d.data());
  
  let budgetedCost = 0;
  for (const a of allocs) {
    const cost = members[a.memberId]?.costPerHour || 0;
    budgetedCost += (a.hours * cost);
    console.log(`Alloc: ${a.id}, Member: ${members[a.memberId]?.name}, Hours: ${a.hours}, CostPerHour: ${cost}, Total: ${a.hours * cost}`);
  }
  
  let plannedCost = 0;
  for (const t of tasks) {
    const cost = members[t.memberId]?.costPerHour || 0;
    plannedCost += (t.durationHours * cost);
    console.log(`Task: ${t.id}, Member: ${members[t.memberId]?.name}, Hours: ${t.durationHours}, CostPerHour: ${cost}, Total: ${t.durationHours * cost}`);
  }
  
  console.log("Calculated Budgeted Cost from Allocations:", budgetedCost);
  console.log("Calculated Planned Cost from Tasks:", plannedCost);
  
  const costsSnap = await db.collection('project_costs').where('projectId', '==', projectId).get();
  let extraCosts = 0;
  costsSnap.forEach(d => extraCosts += (d.data().quantity * d.data().unitCost));
  console.log("Additional Project Costs:", extraCosts);
}

run().catch(console.error);

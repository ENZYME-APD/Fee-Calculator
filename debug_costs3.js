const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const companyId = '9709776b-806c-4ed4-89f1-6d8b1c54ded9';
  const membersSnap = await db.collection('teamMembers').where('companyId', '==', companyId).get();
  let members = {};
  membersSnap.forEach(d => {
    members[d.id] = d.data();
  });
  
  const allocsSnap = await db.collection('allocations').where('projectId', '==', 'lJv4XX7UX6f0m8sUJ3L2').get();
  let allocs = [];
  allocsSnap.forEach(d => allocs.push({id: d.id, ...d.data()}));
  
  const tasksSnap = await db.collection('project_tasks').where('projectId', '==', 'lJv4XX7UX6f0m8sUJ3L2').get();
  let tasks = [];
  tasksSnap.forEach(d => tasks.push({id: d.id, ...d.data()}));
  
  let budgetedCost = 0;
  for (const a of allocs) {
    const cost = members[a.memberId]?.costPerHour || 0;
    budgetedCost += (a.hours * cost);
  }
  
  let plannedCost = 0;
  for (const t of tasks) {
    const cost = members[t.memberId]?.costPerHour || 0;
    plannedCost += (t.durationHours * cost);
  }
  
  console.log("Calculated Budgeted Cost from Allocations:", budgetedCost);
  console.log("Calculated Planned Cost from Tasks:", plannedCost);
  
  // What about project Costs?
  const costsSnap = await db.collection('project_costs').where('projectId', '==', 'lJv4XX7UX6f0m8sUJ3L2').get();
  let extraCosts = 0;
  costsSnap.forEach(d => extraCosts += (d.data().quantity * d.data().unitCost));
  console.log("Additional Project Costs:", extraCosts);
}

run().catch(console.error);

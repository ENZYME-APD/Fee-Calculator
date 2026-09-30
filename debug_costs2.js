const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const companyId = '9709776b-806c-4ed4-89f1-6d8b1c54ded9';
  const membersSnap = await db.collection('team_members').where('companyId', '==', companyId).get();
  console.log("Team members in company:", membersSnap.size);
  membersSnap.forEach(d => {
    console.log(d.id, d.data().name, d.data().costPerHour);
  });
  
  const allocsSnap = await db.collection('allocations').where('projectId', '==', 'lJv4XX7UX6f0m8sUJ3L2').get();
  console.log("Allocations with missing members:");
  allocsSnap.forEach(d => {
    let exists = false;
    membersSnap.forEach(m => { if (m.id === d.data().memberId) exists = true; });
    if (!exists) console.log("Missing member for alloc:", d.data().memberId);
  });
  
  const tasksSnap = await db.collection('project_tasks').where('projectId', '==', 'lJv4XX7UX6f0m8sUJ3L2').get();
  console.log("Tasks count:", tasksSnap.size);
}

run().catch(console.error);

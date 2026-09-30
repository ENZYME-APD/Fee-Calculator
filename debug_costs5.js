const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const projectId = 'lJv4XX7UX6f0m8sUJ3L2';
  
  const phasesSnap = await db.collection('phases').where('projectId', '==', projectId).get();
  const phaseIds = phasesSnap.docs.map(d => d.id);
  console.log("Valid phases for project:", phaseIds);
  
  const allocsSnap = await db.collection('allocations').where('projectId', '==', projectId).get();
  let orphaned = 0;
  let valid = 0;
  allocsSnap.forEach(d => {
    if (!phaseIds.includes(d.data().phaseId)) {
      orphaned++;
      console.log("Orphaned alloc:", d.id, "points to missing phase:", d.data().phaseId);
    } else {
      valid++;
    }
  });
  console.log("Valid allocations:", valid);
  console.log("Orphaned allocations:", orphaned);
}

run().catch(console.error);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const companyId = '9709776b-806c-4ed4-89f1-6d8b1c54ded9';
  
  const phasesSnap = await db.collection('phases').where('companyId', '==', companyId).get();
  const phaseIds = phasesSnap.docs.map(d => d.id);
  
  const allocsSnap = await db.collection('allocations').where('companyId', '==', companyId).get();
  const batch = db.batch();
  let deleted = 0;
  allocsSnap.forEach(d => {
    if (!phaseIds.includes(d.data().phaseId)) {
      batch.delete(d.ref);
      deleted++;
    }
  });
  
  const costsSnap = await db.collection('projectCosts').where('companyId', '==', companyId).get();
  costsSnap.forEach(d => {
    if (!phaseIds.includes(d.data().phaseId)) {
      batch.delete(d.ref);
      deleted++;
    }
  });

  const tasksSnap = await db.collection('projectTasks').where('companyId', '==', companyId).get();
  tasksSnap.forEach(d => {
    if (!phaseIds.includes(d.data().phaseId)) {
      batch.delete(d.ref);
      deleted++;
    }
  });

  if (deleted > 0) {
    await batch.commit();
    console.log(`Cleaned up ${deleted} orphaned records`);
  } else {
    console.log("No orphans found");
  }
}

run().catch(console.error);

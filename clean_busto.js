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
  
  const allocsSnap = await db.collection('allocations').where('projectId', '==', projectId).get();
  const batch = db.batch();
  let deleted = 0;
  allocsSnap.forEach(d => {
    if (!phaseIds.includes(d.data().phaseId)) {
      batch.delete(d.ref);
      deleted++;
    }
  });

  if (deleted > 0) {
    await batch.commit();
    console.log(`Cleaned up ${deleted} orphaned allocations in CASA DIEGO BUSTO`);
  } else {
    console.log("No orphans found in CASA DIEGO BUSTO");
  }
}

run().catch(console.error);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const projectId = 'lJv4XX7UX6f0m8sUJ3L2';
  const allocsSnap = await db.collection('allocations').where('projectId', '==', projectId).get();
  const phaseIds = new Set();
  allocsSnap.forEach(d => phaseIds.add(d.data().phaseId));
  console.log("Allocations use these phaseIds:", Array.from(phaseIds));
  
  for (const pid of phaseIds) {
    const doc = await db.collection('phases').doc(pid).get();
    console.log("Phase", pid, "exists?", doc.exists);
  }
}

run().catch(console.error);

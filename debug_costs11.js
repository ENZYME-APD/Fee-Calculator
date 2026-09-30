const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const p1 = await db.collection('projects').doc('ZE5xFwqGQW7JPgJYxa9b').get();
  console.log("Project ZE5xFwqGQW7JPgJYxa9b name:", p1.data()?.name);
  
  const p2 = await db.collection('projects').doc('G66lJmTtBzBWXBsbn0k8').get();
  console.log("Project G66lJmTtBzBWXBsbn0k8 name:", p2.data()?.name);
}
run().catch(console.error);

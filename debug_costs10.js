const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const doc = await db.collection('allocations').doc('00s285nvHgFWeqLoGseh').get();
  console.log(JSON.stringify(doc.data(), null, 2));
}
run().catch(console.error);

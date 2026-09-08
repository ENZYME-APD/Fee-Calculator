const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

async function run() {
  const user = await auth.getUserByEmail('demo@enzymead.com');
  await db.collection('users').doc(user.uid).update({ role: 'admin' });
  console.log("Updated role to admin");
}

run().catch(console.error);

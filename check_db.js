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
  const userDoc = await db.collection('users').doc(user.uid).get();
  console.log("User doc:", userDoc.data());
  const companyDoc = await db.collection('companies').doc(userDoc.data().companyId).get();
  console.log("Company doc:", companyDoc.data());
  
  const projects = await db.collection('projects').where('companyId', '==', companyDoc.id).get();
  console.log("Projects count:", projects.size);
  projects.forEach(doc => {
    console.log("Project:", doc.data());
  });
}

run().catch(console.error);

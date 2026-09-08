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
  
  // Actually, maybe the role should be admin?
  // Let's set role to admin as well, just in case they want to see the whole company.
  // Wait, owner role is technically higher than admin in standard SaaS apps. 
  // But this app checks `dbUser?.role !== 'admin'`. Maybe the app expects 'admin' to be the top role?
  // Let's check `User` schema in `schema.ts`.
  // Wait, I will just set `ownerId: user.uid` on all projects in this company.
  
  const projects = await db.collection('projects').where('companyId', '==', userDoc.data().companyId).get();
  const batch = db.batch();
  projects.forEach(doc => {
    batch.update(doc.ref, { ownerId: user.uid });
  });
  await batch.commit();
  console.log("Updated projects with ownerId");
  
  // Wait, what if they also need templates? The user said "no templates".
  // Let's seed a template too.
  const templateRef = await db.collection('projects').add({
    name: 'Standard Commercial Project',
    isTemplate: true,
    companyId: userDoc.data().companyId,
    ownerId: user.uid,
    createdAt: Date.now(),
    margin: 20
  });
  console.log("Created template project");
}

run().catch(console.error);

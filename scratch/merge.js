const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

const db = getFirestore();

async function mergeEnzyme() {
  console.log("Fetching Enzyme APD companies...");
  const compSnap = await db.collection('companies').where('name', '==', 'Enzyme APD').get();
  const enzymeCompanies = [];
  compSnap.forEach(c => enzymeCompanies.push({id: c.id, ...c.data()}));

  if (enzymeCompanies.length === 0) {
    console.log("No Enzyme APD companies found.");
    return;
  }

  // Sort to find the oldest one (the main one)
  enzymeCompanies.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const mainCompanyId = enzymeCompanies[0].id;
  console.log("Main Company ID identified as:", mainCompanyId);

  // Get all users
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.email && data.email.endsWith('@weareenzyme.com')) {
      if (data.companyId !== mainCompanyId) {
        console.log(`Updating user ${data.email} to join main company...`);
        await doc.ref.update({ companyId: mainCompanyId });
      } else {
        console.log(`User ${data.email} is already in the main company.`);
      }
    }
  }

  console.log("Consolidation complete!");
}

mergeEnzyme().catch(console.error);

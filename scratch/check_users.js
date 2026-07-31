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

async function check() {
  const usersSnap = await db.collection('users').get();
  console.log("USERS:");
  usersSnap.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
  
  const compSnap = await db.collection('companies').get();
  console.log("\nCOMPANIES:");
  compSnap.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });

  const projSnap = await db.collection('projects').get();
  const counts = {};
  projSnap.forEach(doc => {
    const cid = doc.data().companyId;
    counts[cid] = (counts[cid] || 0) + 1;
  });
  console.log("\nPROJECT COUNTS PER COMPANY:");
  console.log(counts);
}

check().catch(console.error);

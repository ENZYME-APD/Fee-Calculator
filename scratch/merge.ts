import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!))
  });
}

const db = getFirestore();

async function mergeEnzyme() {
  const compSnap = await db.collection('companies').where('name', '==', 'Enzyme APD').get();
  const enzymeCompanies: {id: string, createdAt: number}[] = [];
  compSnap.forEach(c => enzymeCompanies.push({id: c.id, ...c.data() as any}));

  if (enzymeCompanies.length === 0) {
    console.log("No Enzyme APD companies found.");
    return;
  }

  // Find the original company (oldest)
  enzymeCompanies.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const mainCompanyId = enzymeCompanies[0].id;
  console.log("Main Company ID:", mainCompanyId);

  // Get all users
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.email && data.email.endsWith('@weareenzyme.com')) {
      console.log(`Updating user ${data.email} to company ${mainCompanyId}`);
      await doc.ref.update({ companyId: mainCompanyId });
    }
  }

  console.log("Done merging!");
}

mergeEnzyme().catch(console.error);

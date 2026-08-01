import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function consolidateCompanies() {
  console.log("Fetching companies...");
  const companiesSnapshot = await db.collection('companies').get();
  
  const enzymeCompanies: any[] = [];
  companiesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name && data.name.trim().toLowerCase() === 'enzyme apd') {
      enzymeCompanies.push({ id: doc.id, ...data });
    }
  });

  if (enzymeCompanies.length <= 1) {
    console.log(`Found ${enzymeCompanies.length} "Enzyme APD" companies. No consolidation needed.`);
    process.exit(0);
  }

  console.log(`Found ${enzymeCompanies.length} companies named "Enzyme APD":`);
  enzymeCompanies.forEach(c => console.log(`- ${c.id}`));

  // Sort by creation date (if exists) so we keep the oldest one
  enzymeCompanies.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  
  const companyToKeep = enzymeCompanies[0];
  const companiesToRemove = enzymeCompanies.slice(1);
  const companyIdsToRemove = companiesToRemove.map(c => c.id);

  console.log(`\nKeeping Company ID: ${companyToKeep.id}`);
  console.log(`Will reassign data from: ${companyIdsToRemove.join(', ')}`);

  const collectionsToUpdate = ['users', 'projects', 'teamMembers', 'team', 'phases', 'allocations', 'projectCosts', 'payments'];

  let totalUpdated = 0;

  for (const collectionName of collectionsToUpdate) {
    console.log(`\nChecking collection: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    let updatedInCollection = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.companyId && companyIdsToRemove.includes(data.companyId)) {
        await doc.ref.update({ companyId: companyToKeep.id });
        updatedInCollection++;
        totalUpdated++;
      }
    }
    console.log(`Updated ${updatedInCollection} documents in ${collectionName}.`);
  }

  console.log(`\nDeleting duplicate companies...`);
  for (const id of companyIdsToRemove) {
    await db.collection('companies').doc(id).delete();
    console.log(`Deleted company ${id}`);
  }

  console.log(`\nConsolidation complete! Updated ${totalUpdated} records across the database.`);
}

consolidateCompanies().catch(console.error);

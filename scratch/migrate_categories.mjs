import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = './serviceAccountKey.json'; // Make sure this exists, or use env variables if preferred. Actually we know this project is using Firebase.
// wait, the previous consolidate script did:

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY is missing');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const DEFAULT_ORDER = {
    'MANAGEMENT': 1,
    'TEAM GLOBAL': 2,
    'TEAM': 2,
    'TEAM JAKARTA': 3,
    'CONSULTANTS': 4
  };

  const companiesSnap = await db.collection('companies').get();
  
  for (const compDoc of companiesSnap.docs) {
    const companyId = compDoc.id;
    console.log(`Processing company: ${companyId}`);
    
    // Get existing team members to find unique categories
    const membersSnap = await db.collection('teamMembers').where('companyId', '==', companyId).get();
    
    const uniqueCategories = new Set();
    membersSnap.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        uniqueCategories.add(data.category.trim());
      }
    });
    
    // Always include defaults
    uniqueCategories.add('MANAGEMENT');
    uniqueCategories.add('TEAM GLOBAL');
    uniqueCategories.add('TEAM JAKARTA');
    uniqueCategories.add('CONSULTANTS');
    
    let orderCounter = 10;
    const batch = db.batch();
    let count = 0;
    
    for (const catName of uniqueCategories) {
      // Check if it already exists to avoid duplicates if run multiple times
      const existingSnap = await db.collection('categories')
        .where('companyId', '==', companyId)
        .where('name', '==', catName)
        .get();
        
      if (existingSnap.empty) {
        const catRef = db.collection('categories').doc();
        let order = DEFAULT_ORDER[catName.toUpperCase()];
        if (order === undefined) {
          order = orderCounter++;
        }
        
        batch.set(catRef, {
          companyId,
          name: catName,
          order: order
        });
        count++;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`Created ${count} categories for ${companyId}`);
    } else {
      console.log(`No new categories needed for ${companyId}`);
    }
  }
  
  console.log('Migration complete!');
}

run().catch(console.error);

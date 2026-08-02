import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve('.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function runMigration() {
  console.log('Starting migration...');
  
  // 1. Get all companies
  const companiesSnap = await db.collection('companies').get();
  console.log(`Found ${companiesSnap.size} companies`);
  
  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id;
    console.log(`Processing company ${companyId}...`);
    
    // Get categories for company
    const categoriesSnap = await db.collection('categories').where('companyId', '==', companyId).get();
    const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Ensure 'other_expenses' exists
    let otherExpensesCat = categories.find(c => c.id === 'other_expenses');
    if (!otherExpensesCat) {
      console.log('Creating other_expenses category...');
      await db.collection('categories').doc(`other_expenses_${companyId}`).set({
        companyId,
        name: 'OTHER EXPENSES',
        order: 999,
        color: '#fb923c',
        isFixed: true,
        createdAt: new Date().toISOString()
      });
      // also re-push to categories array for matching if needed
      categories.push({ id: `other_expenses_${companyId}`, name: 'OTHER EXPENSES' });
    }

    // Get team members for company
    const membersSnap = await db.collection('teamMembers').where('companyId', '==', companyId).get();
    
    let updatedMembers = 0;
    for (const memberDoc of membersSnap.docs) {
      const member = memberDoc.data();
      if (member.category) {
        // If category matches a name, update it to the id
        const matchedCategory = categories.find(c => c.name.toUpperCase() === member.category.toUpperCase());
        if (matchedCategory && member.category !== matchedCategory.id) {
          await db.collection('teamMembers').doc(memberDoc.id).update({
            category: matchedCategory.id
          });
          updatedMembers++;
        }
      }
    }
    
    console.log(`Updated ${updatedMembers} members for company ${companyId}.`);
  }
  
  console.log('Migration complete!');
}

runMigration().catch(console.error);

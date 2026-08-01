import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateProjects() {
  const projectsRef = db.collection('projects');
  const snapshot = await projectsRef.get();
  
  if (snapshot.empty) {
    console.log("No projects found.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  // Since we don't have the admin ID hardcoded, we will find the user with role='admin'
  const usersRef = db.collection('users');
  const usersSnap = await usersRef.where('role', '==', 'admin').get();
  
  if (usersSnap.empty) {
    console.log("No admin user found. Cannot assign ownerId.");
    process.exit(1);
  }
  
  const adminId = usersSnap.docs[0].id;
  console.log(`Found admin user: ${adminId}`);

  snapshot.forEach(doc => {
    const data = doc.data();
    let updates = {};
    
    if (!data.status) updates.status = 'Draft';
    if (!data.startDate) updates.startDate = data.createdAt || Date.now();
    if (!data.ownerId && !data.isTemplate) updates.ownerId = adminId;
    
    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully migrated ${count} projects.`);
  } else {
    console.log("No projects needed migration.");
  }
}

migrateProjects()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

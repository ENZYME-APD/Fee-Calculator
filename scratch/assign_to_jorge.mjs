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

async function assignProjects() {
  // 1. Get Jorge's user
  const usersRef = db.collection('users');
  const userQuery = await usersRef.where('email', '==', 'j.beneitez@weareenzyme.com').get();
  
  if (userQuery.empty) {
    console.error("Could not find user j.beneitez@weareenzyme.com");
    process.exit(1);
  }
  
  const jorgeUid = userQuery.docs[0].id;
  console.log(`Found Jorge's UID: ${jorgeUid}`);

  // 2. Get all projects
  const projectsRef = db.collection('projects');
  const snapshot = await projectsRef.get();
  
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.isTemplate && data.ownerId !== jorgeUid) {
      batch.update(doc.ref, { ownerId: jorgeUid });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully assigned ${count} projects to Jorge.`);
  } else {
    console.log("No projects needed reassigning.");
  }
}

assignProjects()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkProjects() {
  const projectsSnap = await db.collection('projects').where('isTemplate', '==', false).get();
  console.log(`Found ${projectsSnap.size} projects.`);
  
  for (const doc of projectsSnap.docs) {
    const data = doc.data();
    const paymentsSnap = await db.collection('payments').where('projectId', '==', doc.id).get();
    console.log(`Project "${data.name}" has ${paymentsSnap.size} payments.`);
  }
}

checkProjects().then(() => process.exit(0));

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function testDuplication() {
  const templatesSnap = await db.collection('projects').where('isTemplate', '==', true).get();
  if (templatesSnap.empty) {
    console.log("No templates found.");
    return;
  }
  
  const template = templatesSnap.docs[0];
  console.log("Found template:", template.id, template.data().name);
  
  const paymentsSnap = await db.collection('payments').where('projectId', '==', template.id).get();
  console.log(`Template has ${paymentsSnap.size} payments.`);
  
  if (paymentsSnap.size === 0) {
    console.log("Adding a test payment to template...");
    await db.collection('payments').add({
      projectId: template.id,
      name: 'Test Payment',
      percentage: 100,
      order: 1,
      companyId: template.data().companyId
    });
    console.log("Added. Run test again.");
    return;
  }
}

testDuplication()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkTemplate() {
  const templatesSnap = await db.collection('projects').where('isTemplate', '==', true).get();
  const template = templatesSnap.docs[0];
  const tId = template.id;

  const paymentsSnap = await db.collection('payments').where('projectId', '==', tId).get();
  const payments = paymentsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const phasesSnap = await db.collection('phases').where('projectId', '==', tId).get();
  const phaseIds = phasesSnap.docs.map(d => d.id);
  
  console.log(`Template phases:`, phaseIds);
  console.log(`Template payments phaseIds:`, payments.map(p => p.phaseId));
  
  let valid = true;
  for (const p of payments) {
    if (p.phaseId && !phaseIds.includes(p.phaseId)) {
      console.log(`WARNING: Payment ${p.id} has phaseId ${p.phaseId} which is NOT in the template's phases!`);
      valid = false;
    }
  }
  if (valid) console.log("All payment phaseIds are valid or empty.");
}

checkTemplate().then(() => process.exit(0));

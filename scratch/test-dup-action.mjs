import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function duplicate() {
  const templatesSnap = await db.collection('projects').where('isTemplate', '==', true).get();
  const template = templatesSnap.docs[0];
  const oldId = template.id;

  const paymentsSnap = await db.collection('payments').where('projectId', '==', oldId).get();
  console.log(`Original template payments: ${paymentsSnap.size}`);

  const newProjectRef = db.collection('projects').doc();
  const newId = newProjectRef.id;

  const batch = db.batch();
  batch.set(newProjectRef, { ...template.data(), name: 'Test Duplicate' });

  // phases
  const phasesSnap = await db.collection('phases').where('projectId', '==', oldId).get();
  const phaseMap = new Map();
  for (const p of phasesSnap.docs) {
    const newRef = db.collection('phases').doc();
    phaseMap.set(p.id, newRef.id);
    batch.set(newRef, { ...p.data(), projectId: newId });
  }

  // payments
  for (const p of paymentsSnap.docs) {
    const data = p.data();
    const newRef = db.collection('payments').doc();
    let newPhaseId = data.phaseId;
    if (newPhaseId && phaseMap.has(newPhaseId)) {
      newPhaseId = phaseMap.get(newPhaseId);
    }
    batch.set(newRef, { ...data, projectId: newId, phaseId: newPhaseId });
  }

  await batch.commit();

  const newPayments = await db.collection('payments').where('projectId', '==', newId).get();
  console.log(`New project payments: ${newPayments.size}`);
}

duplicate().then(() => process.exit(0));

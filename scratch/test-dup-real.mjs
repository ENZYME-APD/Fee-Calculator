import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const sanitize = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

async function run() {
  const templatesSnap = await db.collection('projects').where('isTemplate', '==', true).get();
  const template = templatesSnap.docs[0];
  const oldId = template.id;

  const paymentsSnap = await db.collection('payments').where('projectId', '==', oldId).get();
  const payments = paymentsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log(`Original payments: ${payments.length}`);

  const batch = db.batch();
  const newRef = db.collection('projects').doc();
  const newId = newRef.id;

  for (const payment of payments) {
    const newPaymentRef = db.collection('payments').doc();
    const { id: _ignore, projectId: _ignore2, phaseId, ...paymentData } = payment;
    let newPhaseId = phaseId;
    
    // Simulate what the UI does
    const dataToSave = sanitize({ ...paymentData, projectId: newId, phaseId: newPhaseId, companyId: '123' });
    console.log("Saving payment:", dataToSave);
    batch.set(newPaymentRef, dataToSave);
  }

  await batch.commit();
  console.log("Committed successfully!");
}

run().then(() => process.exit(0));

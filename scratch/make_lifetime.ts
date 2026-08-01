import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

async function setLifetime() {
  const companyId = '9709776b-806c-4ed4-89f1-6d8b1c54ded9'; // Enzyme APD
  
  console.log(`Setting lifetime subscription for company ${companyId}...`);
  
  await db.collection('companies').doc(companyId).update({
    subscriptionStatus: 'lifetime',
    // Set trial ends at to 100 years from now just in case some other logic checks it
    trialEndsAt: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000 
  });
  
  console.log("Success! Enzyme APD now has a lifetime unlimited subscription.");
}

setLifetime().catch(console.error);

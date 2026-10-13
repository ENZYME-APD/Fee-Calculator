import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountStr) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountStr)),
    });
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is missing. Admin SDK calls will fail.');
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
export const adminDb = getApps().length ? getFirestore() : null;

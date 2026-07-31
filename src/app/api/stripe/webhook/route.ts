import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (safe to call multiple times in dev)
if (!getApps().length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountStr) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccountStr)),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Webhooks won't be able to update DB.");
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

const db = getApps().length ? getFirestore() : null;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed.', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.companyId;

        if (companyId) {
          await db.collection('companies').doc(companyId).update({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
          });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Find company by customer ID
        const snapshot = await db.collection('companies')
          .where('stripeCustomerId', '==', subscription.customer)
          .get();
        
        if (!snapshot.empty) {
          const companyDoc = snapshot.docs[0];
          await companyDoc.ref.update({
            subscriptionStatus: subscription.status, // 'active', 'past_due', 'canceled', etc
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const snapshot = await db.collection('companies')
          .where('stripeCustomerId', '==', subscription.customer)
          .get();
          
        if (!snapshot.empty) {
          const companyDoc = snapshot.docs[0];
          await companyDoc.ref.update({
            subscriptionStatus: 'canceled',
          });
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

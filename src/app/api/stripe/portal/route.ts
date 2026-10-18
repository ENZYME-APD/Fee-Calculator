import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { stripe } from '@/lib/seats';

// Opens the Stripe customer portal for the signed-in admin's company: card, invoices, switching
// between monthly and yearly, and cancelling at the end of the period. Users are managed in the app.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PORTAL_CONFIGURATION = 'bpc_1URrtFC3LxIaocWGazu7E8y5'; // "Fee Calculator" portal in Stripe

export async function POST(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!adminAuth || !adminDb || !h.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  let uid: string; let email = '';
  try { const d = await adminAuth.verifyIdToken(h.slice(7)); uid = d.uid; email = String(d.email || '').toLowerCase(); }
  catch { return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }); }
  const user = (await adminDb.collection('users').doc(uid).get()).data();
  if (!user?.companyId) return NextResponse.json({ error: 'Your account is not part of a company.' }, { status: 403 });
  if (user.role !== 'admin' && !email.endsWith('@weareenzyme.com')) return NextResponse.json({ error: 'Only admins can manage billing.' }, { status: 403 });
  const company = (await adminDb.collection('companies').doc(user.companyId).get()).data();
  if (!company?.stripeCustomerId) return NextResponse.json({ error: 'There is no Stripe billing for this company yet.' }, { status: 400 });
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      configuration: PORTAL_CONFIGURATION,
      return_url: `${origin}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('Billing portal error', e);
    return NextResponse.json({ error: 'Stripe could not open the billing portal. Try again in a moment.' }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { INCLUDED_USERS, isPlanPrice, payingUsers, stripe } from '@/lib/seats';

// Starts a Stripe checkout for the signed-in admin's company. The quantity is the number of paying
// users (admins and members, plus pending invites for them): the price includes 5 and charges per
// extra user beyond that.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const h = req.headers.get('authorization') || '';
    if (!adminAuth || !adminDb || !h.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    let uid: string; let email = '';
    try { const d = await adminAuth.verifyIdToken(h.slice(7)); uid = d.uid; email = String(d.email || '').toLowerCase(); }
    catch { return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }); }
    const user = (await adminDb.collection('users').doc(uid).get()).data();
    if (!user?.companyId) return NextResponse.json({ error: 'Your account is not part of a company.' }, { status: 403 });
    if (user.role !== 'admin' && !email.endsWith('@weareenzyme.com')) return NextResponse.json({ error: 'Only admins can subscribe.' }, { status: 403 });

    const { priceId } = await req.json();
    if (!priceId || !isPlanPrice(priceId)) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });

    const count = await payingUsers(user.companyId);
    const quantity = Math.max(1, count.users + count.invites);
    const company = (await adminDb.collection('companies').doc(user.companyId).get()).data() || {};

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity }],
      metadata: { companyId: user.companyId },
      subscription_data: { metadata: { companyId: user.companyId } },
      ...(company.stripeCustomerId ? { customer: company.stripeCustomerId } : { customer_email: email || undefined }),
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?canceled=true`,
    });

    return NextResponse.json({ url: session.url, users: quantity, included: INCLUDED_USERS });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

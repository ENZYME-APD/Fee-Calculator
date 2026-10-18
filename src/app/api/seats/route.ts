import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { INCLUDED_USERS, seatState, setPaidUsers } from '@/lib/seats';

// Users and billing for Settings → Team management and Billing (admins).
// GET: the plan's users (included, in use, paid for) and the price of an extra one.
// POST { action: 'add', count } pays for more users, after the admin confirmed the extra cost.
// POST { action: 'trim' } stops paying for users nobody is using.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function admin(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!adminAuth || !adminDb || !h.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(h.slice(7));
    const user = (await adminDb.collection('users').doc(decoded.uid).get()).data();
    if (!user?.companyId) return null;
    const isAdmin = user.role === 'admin' || String(decoded.email || '').toLowerCase().endsWith('@weareenzyme.com');
    return isAdmin ? { companyId: user.companyId as string } : null;
  } catch { return null; }
}

const view = (s: Awaited<ReturnType<typeof seatState>>) => ({
  included: s.included, used: s.used, capacity: Number.isFinite(s.capacity) ? s.capacity : null,
  mode: s.mode, interval: s.interval, extraPrice: s.extraPrice,
  extraPaid: s.mode === 'subscription' ? Math.max(0, s.capacity - INCLUDED_USERS) : 0,
});

export async function GET(req: Request) {
  const who = await admin(req);
  if (!who) return NextResponse.json({ error: 'Only admins can see users and billing.' }, { status: 403 });
  return NextResponse.json(view(await seatState(who.companyId)));
}

export async function POST(req: Request) {
  const who = await admin(req);
  if (!who) return NextResponse.json({ error: 'Only admins can change users and billing.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const state = await seatState(who.companyId);
  if (state.mode !== 'subscription') return NextResponse.json(view(state)); // trial or lifetime: nothing to bill

  try {
    if (body.action === 'add') {
      const count = Math.min(50, Math.max(1, Math.round(Number(body.count) || 1)));
      const needed = state.used + count;
      if (needed > state.capacity) await setPaidUsers(state, needed);
    } else if (body.action === 'trim') {
      // Never below what's in use, and the included users are free anyway
      const target = Math.max(1, state.used);
      if (state.quantity > Math.max(target, INCLUDED_USERS)) await setPaidUsers(state, Math.max(target, INCLUDED_USERS));
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e) {
    console.error('Seat change failed', e);
    return NextResponse.json({ error: 'Stripe could not update the subscription. Nothing was changed.' }, { status: 502 });
  }
  return NextResponse.json(view(await seatState(who.companyId)));
}

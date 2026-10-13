import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Provisions a user's Firestore `users/{uid}` document server-side.
//
// This exists because companyId and role were previously set by the client
// directly via `setDoc(doc(db, 'users', uid), ...)`. Firestore rules can only
// check that `request.auth.uid == userId` for that write — they can't verify
// the companyId/role being claimed is legitimate. That let any authenticated
// user write an arbitrary companyId (e.g. another company's) and role
// ('admin') into their own user doc and instantly gain admin access to a
// company they were never invited to. Routing this through a server endpoint
// that validates invites against Firestore with the Admin SDK (which bypasses
// client rules) closes that hole; the corresponding Firestore rule now denies
// direct client writes to `users/{userId}` entirely.
export async function POST(req: Request) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const uid = decoded.uid;
  const email = (decoded.email || '').toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Token has no email' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { mode } = body;

  const userDocRef = adminDb.collection('users').doc(uid);
  const existingUserDoc = await userDocRef.get();

  if (mode === 'invite') {
    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) {
      return NextResponse.json({ error: 'Missing invite token' }, { status: 400 });
    }

    const inviteSnap = await adminDb.collection('invites').where('token', '==', token).limit(1).get();
    if (inviteSnap.empty) {
      return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 });
    }
    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();

    if ((invite.email || '').toLowerCase() !== email) {
      return NextResponse.json(
        { error: 'This invite was issued to a different email address' },
        { status: 403 }
      );
    }

    await userDocRef.set(
      {
        email,
        companyId: invite.companyId,
        role: invite.role,
        ...(existingUserDoc.exists ? {} : { displayName: body.displayName || '' }),
      },
      { merge: true }
    );
    await inviteDoc.ref.delete();

    return NextResponse.json({ companyId: invite.companyId, role: invite.role });
  }

  if (mode === 'signup') {
    if (existingUserDoc.exists) {
      // Already provisioned (e.g. re-submitted signup form) — return their existing assignment
      // rather than letting them re-provision themselves into a new company.
      const data = existingUserDoc.data()!;
      return NextResponse.json({ companyId: data.companyId, role: data.role });
    }

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const isEnzymeEmail = email.endsWith('@weareenzyme.com');
    const companyRef = adminDb.collection('companies').doc();
    await companyRef.set({
      name: companyName,
      subscriptionStatus: isEnzymeEmail ? 'lifetime' : 'trialing',
      trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });

    await userDocRef.set({
      email,
      displayName: body.displayName || '',
      companyId: companyRef.id,
      role: 'admin',
    });

    return NextResponse.json({ companyId: companyRef.id, role: 'admin' });
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}

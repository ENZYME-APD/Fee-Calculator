import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Public preview of a pending invite, looked up by its token.
//
// The invite landing page (/invite/[token]) and the login page's invite flow
// are visited by people who don't have an account yet, so they can't read
// `invites` or `companies` from the client: Firestore rules require an
// authenticated user whose companyId matches the document. Opening those
// rules up isn't an option either — a rule can't restrict a `where('token',
// '==', ...)` query to "only the caller's token", so it would expose every
// pending invite. Instead, the lookup happens here with the Admin SDK and
// returns only what the invitee needs to see: their own email, the role and
// the company's display name. Holding the token is what authorises this,
// the same way it authorises accepting the invite in /api/auth/provision.
export async function GET(req: Request) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const token = new URL(req.url).searchParams.get('token') || '';
  if (!token || token.length > 128) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  const inviteSnap = await adminDb.collection('invites').where('token', '==', token).limit(1).get();
  if (inviteSnap.empty) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  const invite = inviteSnap.docs[0].data();
  const companySnap = invite.companyId
    ? await adminDb.collection('companies').doc(invite.companyId).get()
    : null;

  return NextResponse.json(
    {
      email: invite.email || '',
      role: invite.role || 'member',
      companyName: (companySnap?.exists && companySnap.data()?.name) || '',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

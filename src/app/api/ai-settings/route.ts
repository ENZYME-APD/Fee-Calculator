import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getAiSettings, mayChange, mayConnect, saveAiSettings } from '@/lib/mcp/settings';

// The company's AI access rules. Anyone in the company can read them (to see what they may do);
// only admins can change them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function caller(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!adminAuth || !adminDb || !h.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(h.slice(7));
    const user = (await adminDb.collection('users').doc(decoded.uid).get()).data();
    if (!user?.companyId) return null;
    const isAdmin = user.role === 'admin' || String(decoded.email || '').toLowerCase().endsWith('@weareenzyme.com');
    return { uid: decoded.uid, email: String(decoded.email || ''), companyId: user.companyId as string, role: user.role, isAdmin };
  } catch { return null; }
}

async function view(who: NonNullable<Awaited<ReturnType<typeof caller>>>) {
  const settings = await getAiSettings(who.companyId);
  return {
    settings: { connect: settings.connect, changes: settings.changes },
    you: {
      isAdmin: who.isAdmin,
      canConnect: mayConnect(settings, who.role, who.isAdmin),
      canAllowChanges: who.role !== 'viewer' || who.isAdmin ? mayChange(settings, who.role, who.isAdmin) : false,
    },
  };
}

export async function GET(req: Request) {
  const who = await caller(req);
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json(await view(who));
}

export async function POST(req: Request) {
  const who = await caller(req);
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!who.isAdmin) return NextResponse.json({ error: 'Only admins can change AI access.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  try { await saveAiSettings(who.companyId, body, who.email); }
  catch { return NextResponse.json({ error: 'Choose who can connect and who can make changes.' }, { status: 400 }); }
  return NextResponse.json(await view(who));
}

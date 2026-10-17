import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { ChangeError, listChanges, undoChange } from '@/lib/mcp/changes';

// Changes made through the AI connection, for Settings → AI access: list them and undo one.
// Admins see the whole company's changes; everyone else sees their own.
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
    return { uid: decoded.uid, companyId: user.companyId as string, isAdmin };
  } catch { return null; }
}

async function list(who: { uid: string; companyId: string; isAdmin: boolean }) {
  const changes = await listChanges(who.companyId, { uid: who.isAdmin ? undefined : who.uid, limit: 30 });
  return changes.map(c => ({
    id: c.id, summary: c.summary, who: c.who, via: c.client, createdAt: c.createdAt,
    undoneAt: c.undoneAt ?? null, canUndo: !c.undoneAt && (c.uid === who.uid || who.isAdmin),
  }));
}

export async function GET(req: Request) {
  const who = await caller(req);
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json({ changes: await list(who) });
}

export async function POST(req: Request) {
  const who = await caller(req);
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    await undoChange(who, String(body.id || ''));
  } catch (e) {
    if (e instanceof ChangeError) return NextResponse.json({ error: e.message, changes: await list(who) }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ changes: await list(who) });
}

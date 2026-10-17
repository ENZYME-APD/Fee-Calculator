import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { generateToken, hashToken, MAX_TOKENS_PER_USER, McpTokenDoc, OAuthGrantDoc } from '@/lib/mcp/auth';
import { revokeGrant } from '@/lib/mcp/oauth';

// The signed-in user's AI connections: access keys (create, list, revoke; a key is shown once) and
// apps connected by signing in (list, disconnect).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function caller(req: Request): Promise<string | null> {
  const h = req.headers.get('authorization') || '';
  if (!adminAuth || !h.startsWith('Bearer ')) return null;
  try { return (await adminAuth.verifyIdToken(h.slice(7))).uid; } catch { return null; }
}

async function state(uid: string) {
  const [tokens, grants] = await Promise.all([
    adminDb!.collection('mcpTokens').where('uid', '==', uid).get(),
    adminDb!.collection('oauthGrants').where('uid', '==', uid).get(),
  ]);
  const keys = tokens.docs
    .map(d => ({ id: d.id, ...(d.data() as McpTokenDoc) }))
    .filter(k => !k.revokedAt && k.kind !== 'oauth')
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(k => ({ id: k.id, name: k.name, hint: k.hint, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt ?? null, canWrite: !!k.canWrite }));
  const apps = grants.docs
    .map(d => ({ id: d.id, ...(d.data() as OAuthGrantDoc) }))
    .filter(g => !g.revokedAt && g.refreshExpiresAt > Date.now())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(g => ({ id: g.id, name: g.clientName, createdAt: g.createdAt, lastUsedAt: g.lastUsedAt ?? null, canWrite: g.canWrite }));
  return { keys, apps };
}

export async function GET(req: Request) {
  const uid = await caller(req);
  if (!uid || !adminDb) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json(await state(uid));
}

export async function POST(req: Request) {
  const uid = await caller(req);
  if (!uid || !adminDb) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const user = (await adminDb.collection('users').doc(uid).get()).data();
  if (!user?.companyId) return NextResponse.json({ error: 'Your account is not part of a company' }, { status: 403 });
  if ((await state(uid)).keys.length >= MAX_TOKENS_PER_USER) {
    return NextResponse.json({ error: `You can have up to ${MAX_TOKENS_PER_USER} keys. Revoke one first.` }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const name = (typeof body.name === 'string' ? body.name.trim() : '').slice(0, 60) || 'AI assistant';
  const isAdmin = user.role === 'admin' || String(user.email || '').toLowerCase().endsWith('@weareenzyme.com');
  const canWrite = body.canWrite === true && (user.role !== 'viewer' || isAdmin);
  const token = generateToken();
  const doc: McpTokenDoc = { uid, name, hint: token.slice(0, 12), createdAt: Date.now(), canWrite, kind: 'key' };
  await adminDb.collection('mcpTokens').doc(hashToken(token)).set(doc);
  return NextResponse.json({ token, ...(await state(uid)) });
}

export async function DELETE(req: Request) {
  const uid = await caller(req);
  if (!uid || !adminDb) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const appId = q.get('app');
  if (appId) {
    if (!(await revokeGrant(appId, uid))) return NextResponse.json({ error: 'App not found' }, { status: 404 });
    return NextResponse.json(await state(uid));
  }
  const id = q.get('id') || '';
  const ref = adminDb.collection('mcpTokens').doc(id);
  const snap = id ? await ref.get() : null;
  if (!snap?.exists || snap.data()?.uid !== uid) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  await ref.update({ revokedAt: Date.now() });
  return NextResponse.json(await state(uid));
}

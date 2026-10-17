import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { generateToken, hashToken, MAX_TOKENS_PER_USER, McpTokenDoc } from '@/lib/mcp/auth';

// Create, list and revoke the signed-in user's AI access keys. Keys are shown once, on creation.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function caller(req: Request): Promise<string | null> {
  const h = req.headers.get('authorization') || '';
  if (!adminAuth || !h.startsWith('Bearer ')) return null;
  try { return (await adminAuth.verifyIdToken(h.slice(7))).uid; } catch { return null; }
}

async function myKeys(uid: string) {
  const snap = await adminDb!.collection('mcpTokens').where('uid', '==', uid).get();
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as McpTokenDoc) }))
    .filter(k => !k.revokedAt)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(k => ({ id: k.id, name: k.name, hint: k.hint, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt ?? null }));
}

export async function GET(req: Request) {
  const uid = await caller(req);
  if (!uid || !adminDb) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json({ keys: await myKeys(uid) });
}

export async function POST(req: Request) {
  const uid = await caller(req);
  if (!uid || !adminDb) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const user = (await adminDb.collection('users').doc(uid).get()).data();
  if (!user?.companyId) return NextResponse.json({ error: 'Your account is not part of a company' }, { status: 403 });
  if ((await myKeys(uid)).length >= MAX_TOKENS_PER_USER) {
    return NextResponse.json({ error: `You can have up to ${MAX_TOKENS_PER_USER} keys. Revoke one first.` }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const name = (typeof body.name === 'string' ? body.name.trim() : '').slice(0, 60) || 'AI assistant';
  const token = generateToken();
  const doc: McpTokenDoc = { uid, name, hint: token.slice(0, 12), createdAt: Date.now() };
  await adminDb.collection('mcpTokens').doc(hashToken(token)).set(doc);
  return NextResponse.json({ token, keys: await myKeys(uid) });
}

export async function DELETE(req: Request) {
  const uid = await caller(req);
  if (!uid || !adminDb) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  const ref = adminDb.collection('mcpTokens').doc(id);
  const snap = id ? await ref.get() : null;
  if (!snap?.exists || snap.data()?.uid !== uid) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  await ref.update({ revokedAt: Date.now() });
  return NextResponse.json({ keys: await myKeys(uid) });
}

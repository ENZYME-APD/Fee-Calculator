import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { readEntries, recordEntries } from '@/lib/activityServer';
import { listChanges } from '@/lib/mcp/changes';

// Change log. POST: the app reports what a signed-in user just saved (who and when are stamped here,
// never taken from the request). GET: admins read the company's log, including changes made by AI
// assistants.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function caller(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!adminAuth || !adminDb || !h.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(h.slice(7));
    const user = (await adminDb.collection('users').doc(decoded.uid).get()).data();
    if (!user?.companyId) return null;
    const email = String(decoded.email || '').toLowerCase();
    return {
      uid: decoded.uid,
      name: String(user.displayName || decoded.name || email || 'Someone'),
      companyId: user.companyId as string,
      isAdmin: user.role === 'admin' || email.endsWith('@weareenzyme.com'),
    };
  } catch { return null; }
}

export async function POST(req: Request) {
  const who = await caller(req);
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const entries = Array.isArray(body.entries) ? body.entries : [];
  const saved = await recordEntries(who, entries);
  return NextResponse.json({ saved });
}

export async function GET(req: Request) {
  const who = await caller(req);
  if (!who) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!who.isAdmin) return NextResponse.json({ error: 'Only admins can see the activity log.' }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const before = Number(q.get('before')) || undefined;
  const limit = 150;

  const [app, ai] = await Promise.all([
    readEntries(who.companyId, { before, limit }),
    listChanges(who.companyId, { limit: 500 }),
  ]);
  const aiEntries = ai
    .filter(c => !before || c.createdAt < before)
    .map(c => ({
      id: `ai_${c.id}`,
      who: c.who,
      via: `AI · ${c.client}`,
      action: (c.ops.every(o => !o.before) ? 'create' : c.ops.every(o => !o.after) ? 'delete' : 'update') as 'create' | 'update' | 'delete',
      area: c.ops[0]?.collection || 'other',
      label: null,
      projectName: null,
      summary: c.summary,
      changes: null,
      fields: null,
      createdAt: c.createdAt,
      undoneAt: c.undoneAt ?? null,
    }));
  const merged = [...app.map(e => ({ ...e, undoneAt: null })), ...aiEntries]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  // More to load only if the app log page was full (AI changes are all in memory already)
  const hasMore = app.length === limit;
  return NextResponse.json({ entries: merged, nextBefore: hasMore ? merged[merged.length - 1]?.createdAt ?? null : null });
}

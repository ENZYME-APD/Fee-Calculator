import { adminDb } from '@/lib/firebase/admin';
import { McpContext } from './auth';

// Every change the AI connection makes goes through here: it is written in one transaction together
// with a change record holding each document before and after, so it can be listed and undone (from
// the assistant or from Settings → AI access). Undo refuses if someone has changed those documents
// since, so it never overwrites newer work. Change records use `company`, not `companyId`, so the
// general Firestore rule doesn't expose them (they can contain forecast figures) to every member.

type Data = Record<string, unknown>;

export interface DocOp {
  collection: string;
  id: string;
  data: Data | null; // full new document, or null to delete it
}

export interface ChangeDoc {
  company: string;
  uid: string;
  who: string;
  client: string;
  tool: string;
  summary: string;
  createdAt: number;
  undoneAt?: number;
  ops: { collection: string; id: string; before: Data | null; after: Data | null }[];
}

export class ChangeError extends Error {}

const clean = (d: Data) => JSON.parse(JSON.stringify(d)) as Data; // drops undefined, like the app's sanitize

/** Stable comparison of two documents (key order doesn't matter). */
function same(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v as Data).sort().map(k => [k, norm((v as Data)[k])]));
    return v;
  };
  return JSON.stringify(norm(a ?? null)) === JSON.stringify(norm(b ?? null));
}

export function newId(collection: string): string {
  return adminDb!.collection(collection).doc().id;
}

export async function applyChange(ctx: McpContext, tool: string, summary: string, ops: DocOp[]): Promise<string> {
  if (!ops.length) throw new ChangeError('Nothing to change.');
  const db = adminDb!;
  const changeRef = db.collection('mcpChanges').doc();
  await db.runTransaction(async tx => {
    const snaps = await Promise.all(ops.map(op => tx.get(db.collection(op.collection).doc(op.id))));
    const recorded: ChangeDoc['ops'] = [];
    ops.forEach((op, i) => {
      const before = snaps[i].exists ? (snaps[i].data() as Data) : null;
      if (before && before.companyId !== ctx.companyId) throw new ChangeError('That record belongs to another company.');
      const after = op.data ? clean({ ...op.data, companyId: ctx.companyId }) : null;
      const ref = db.collection(op.collection).doc(op.id);
      if (after) tx.set(ref, after);
      else if (before) tx.delete(ref);
      recorded.push({ collection: op.collection, id: op.id, before, after });
    });
    const change: ChangeDoc = {
      company: ctx.companyId, uid: ctx.uid, who: ctx.displayName, client: ctx.clientName,
      tool, summary, createdAt: Date.now(), ops: recorded,
    };
    tx.set(changeRef, clean(change as unknown as Data));
  });
  return changeRef.id;
}

export async function listChanges(companyId: string, opts: { uid?: string; limit?: number } = {}) {
  const snap = await adminDb!.collection('mcpChanges').where('company', '==', companyId).get();
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as ChangeDoc) }))
    .filter(c => !opts.uid || c.uid === opts.uid)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, opts.limit ?? 20);
}

/** Restores the documents a change touched. Only its author or a company admin may undo it. */
export async function undoChange(
  who: { uid: string; companyId: string; isAdmin: boolean },
  changeId: string,
): Promise<ChangeDoc> {
  const db = adminDb!;
  const ref = db.collection('mcpChanges').doc(changeId);
  let result: ChangeDoc | null = null;
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const change = snap.data() as ChangeDoc | undefined;
    if (!change || change.company !== who.companyId) throw new ChangeError('Change not found.');
    if (change.uid !== who.uid && !who.isAdmin) throw new ChangeError('Only the person who made this change, or an admin, can undo it.');
    if (change.undoneAt) throw new ChangeError('This change has already been undone.');
    const current = await Promise.all(change.ops.map(op => tx.get(db.collection(op.collection).doc(op.id))));
    change.ops.forEach((op, i) => {
      const now = current[i].exists ? current[i].data() : null;
      if (!same(now, op.after)) {
        throw new ChangeError('Something in this change has been edited since, so it can\'t be undone automatically. Make the correction by hand, or undo the later changes first.');
      }
    });
    change.ops.forEach(op => {
      const r = db.collection(op.collection).doc(op.id);
      if (op.before) tx.set(r, op.before);
      else tx.delete(r);
    });
    tx.update(ref, { undoneAt: Date.now() });
    result = change;
  });
  return result!;
}

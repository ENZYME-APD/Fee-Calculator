import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// How long entries are kept once the Firestore TTL policy on expireAt is switched on (collection group
// 'entries', field 'expireAt'). Without the policy nothing is deleted.
export const RETENTION_DAYS = 365;

// Server side of the change log. Entries live in activityLog/{companyId}/entries and carry no
// companyId field, so the general Firestore rule never lets clients read them. A client could still
// create a document there (the general create rule only checks companyId), so the reader ignores any
// entry that has a companyId field, and the server always stamps `server: true`.

export const AREAS: Record<string, { label: string; named: boolean }> = {
  companies: { label: 'company settings', named: true },
  invites: { label: 'invite', named: false },
  users: { label: 'user', named: false },
  categories: { label: 'team category', named: true },
  teamMembers: { label: 'team member', named: true },
  projects: { label: 'project', named: true },
  phases: { label: 'phase', named: true },
  allocations: { label: 'team hours', named: false },
  projectCosts: { label: 'direct cost', named: true },
  payments: { label: 'payment milestone', named: true },
  projectTasks: { label: 'planning task', named: true },
  documentBlocks: { label: 'document block', named: false },
  saved_blocks: { label: 'saved block', named: false },
  overheadsProfile: { label: 'overheads', named: false },
  forecastProfile: { label: 'financial forecast', named: false },
  sampleData: { label: 'sample data', named: false },
};

const FIELD_LABELS: Record<string, string> = {
  profitMargin: 'margin %', fixedFee: 'fixed fee', durationWeeks: 'duration (weeks)', costPerHour: 'cost per hour',
  salary: 'salary', overheads: 'overheads', nonBillablePercentage: 'non-billable %', startDate: 'start date',
  unitCost: 'unit cost', percentage: 'percent', amount: 'amount', hours: 'hours', name: 'name', status: 'status',
  position: 'position', category: 'category', role: 'role', description: 'description', area: 'area',
  costPerHourSnapshot: 'agreed rate', memberId: 'team member', quantity: 'quantity', order: 'order',
};

const MAX_CHANGES_JSON = 4000;
type Json = Record<string, unknown>;

export interface StoredEntry {
  server: true;
  uid: string;
  who: string;
  via: string;
  action: 'create' | 'update' | 'delete';
  area: string;
  docId: string | null;
  label: string | null;
  projectId: string | null;
  projectName: string | null;
  summary: string;
  changes: Json | null;
  fields: string[] | null;
  createdAt: number;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('en-US') : String(Math.round(v * 100) / 100);
  if (typeof v === 'boolean') return v ? 'on' : 'off';
  if (typeof v === 'string') return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  return Array.isArray(v) ? `${v.length} items` : 'updated';
}

/** Names of documents, cached per request. */
class Names {
  private cache = new Map<string, Promise<Json | null>>();
  constructor(private companyId: string) {}
  doc(collection: string, id?: string | null): Promise<Json | null> {
    if (!id) return Promise.resolve(null);
    const key = `${collection}/${id}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, adminDb!.collection(collection).doc(id).get().then(s => {
        const d = s.data();
        return d && d.companyId === this.companyId ? (d as Json) : null; // never resolve another company's names
      }).catch(() => null));
    }
    return this.cache.get(key)!;
  }
}

export async function recordEntries(
  who: { uid: string; name: string; companyId: string },
  raw: unknown[],
): Promise<number> {
  const names = new Names(who.companyId);
  const out: StoredEntry[] = [];
  for (const r of raw.slice(0, 50)) {
    if (!r || typeof r !== 'object') continue;
    const e = r as Json;
    const action = e.action;
    const area = String(e.area || '');
    if ((action !== 'create' && action !== 'update' && action !== 'delete') || !AREAS[area]) continue;
    const docId = typeof e.docId === 'string' ? e.docId.slice(0, 100) : null;
    const refs = (e.refs && typeof e.refs === 'object' ? e.refs : {}) as Json;
    const own = action === 'delete' ? null : await names.doc(area, docId);

    // What it is
    let label = typeof e.label === 'string' ? e.label.slice(0, 120) : null;
    if (!label && own && typeof own.name === 'string') label = own.name;
    if (!label && own && typeof own.title === 'string') label = own.title;
    const memberId = (refs.memberId as string) || (own?.memberId as string) || null;
    const phaseId = (refs.phaseId as string) || (own?.phaseId as string) || null;
    if (!label && area === 'allocations') {
      const [m, ph] = await Promise.all([names.doc('teamMembers', memberId), names.doc('phases', phaseId)]);
      label = [m?.name, ph?.name].filter(Boolean).join(' on ') || null;
    }
    const projectId = (refs.projectId as string) || (area === 'projects' ? docId : (own?.projectId as string)) || null;
    const project = await names.doc('projects', projectId);
    const projectName = (project?.name as string) || (area === 'projects' ? label : null) || null;

    // What changed
    const fieldsOnly = e.fieldsOnly === true;
    let changes: Json | null = e.changes && typeof e.changes === 'object' ? (e.changes as Json) : null;
    let fields: string[] | null = changes ? Object.keys(changes).filter(k => k !== 'companyId' && k !== 'updatedAt') : null;
    if (changes) {
      delete changes.companyId; delete changes.updatedAt;
      if (fieldsOnly || JSON.stringify(changes).length > MAX_CHANGES_JSON) changes = null;
    }
    if (fields && !fields.length) fields = null;

    // A readable sentence
    const what = AREAS[area].label;
    const count = typeof e.count === 'number' && e.count > 1 ? e.count : 0;
    let summary = typeof e.summary === 'string' && e.summary.trim() ? e.summary.trim().slice(0, 300) : '';
    if (!summary) {
      const verb = action === 'create' ? 'Added' : action === 'delete' ? 'Deleted' : 'Changed';
      const thing = count ? `${count} ${what}s` : `${what}${label ? ` "${label}"` : ''}`;
      const where = projectName && area !== 'projects' ? ` in ${projectName}` : '';
      let detail = '';
      if (action === 'update' && changes) {
        const parts = Object.entries(changes).slice(0, 4).map(([k, v]) => `${FIELD_LABELS[k] || k} → ${fmt(v)}`);
        if (parts.length) detail = `: ${parts.join(', ')}${Object.keys(changes).length > 4 ? '…' : ''}`;
      } else if (action === 'update' && fields) {
        detail = `: ${fields.slice(0, 5).map(k => FIELD_LABELS[k] || k).join(', ')}`;
      }
      summary = `${verb} ${thing}${where}${detail}`;
    }

    out.push({
      server: true, uid: who.uid, who: who.name, via: 'App', action, area, docId, label,
      projectId: projectId || null, projectName, summary, changes, fields, createdAt: Date.now(),
    });
  }
  if (!out.length) return 0;
  const batch = adminDb!.batch();
  const col = adminDb!.collection('activityLog').doc(who.companyId).collection('entries');
  out.forEach(entry => batch.set(col.doc(), { ...JSON.parse(JSON.stringify(entry)), expireAt: Timestamp.fromMillis(entry.createdAt + RETENTION_DAYS * 86400000) }));
  await batch.commit();
  return out.length;
}

export async function readEntries(companyId: string, opts: { before?: number; limit?: number } = {}) {
  let q = adminDb!.collection('activityLog').doc(companyId).collection('entries').orderBy('createdAt', 'desc');
  if (opts.before) q = q.where('createdAt', '<', opts.before);
  const snap = await q.limit(Math.min(opts.limit || 100, 300)).get();
  return snap.docs
    .map(d => { const { expireAt: _e, ...rest } = d.data() as Json; return { id: d.id, ...rest }; })
    .filter(d => d.server === true && d.companyId === undefined) as (StoredEntry & { id: string })[];
}

import { auth } from '@/lib/firebase/config';

// Change log for edits made in the app (Settings → Activity). Every save in db.ts reports what it did
// here; entries are batched and sent to /api/activity, where the server stamps who and when and
// stores them where clients can't edit or delete them. Pages that autosave (forecast, overheads,
// planner, document builder) are merged into one entry per item every few minutes.
//
// Until the server-side log (Firestore triggers) replaces it, this records what the app reports,
// so a change made outside the app, e.g. straight against the database, wouldn't appear.

export type ActivityAction = 'create' | 'update' | 'delete';

export interface ActivityEntry {
  action: ActivityAction;
  area: string; // Firestore collection, e.g. projects
  docId?: string;
  label?: string; // name of the thing, if known
  summary?: string; // overrides the generated sentence
  changes?: Record<string, unknown>; // new values (update/create)
  fieldsOnly?: boolean; // big documents: keep the field names, not the values
  refs?: { projectId?: string; phaseId?: string; memberId?: string };
  count?: number; // for batch operations
  coalesce?: boolean; // autosave: merge repeated edits into one entry
}

const queue: ActivityEntry[] = [];
const pendingMerge = new Map<string, { entry: ActivityEntry; timer: ReturnType<typeof setTimeout> }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const MERGE_WINDOW_MS = 3 * 60 * 1000;

async function send(entries: ActivityEntry[], keepalive = false) {
  if (!entries.length) return;
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entries }),
      keepalive,
    });
  } catch {
    // The log must never get in the way of saving work
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; send(queue.splice(0, 50)); if (queue.length) scheduleFlush(); }, 1500);
}

export function logActivity(entry: ActivityEntry) {
  if (typeof window === 'undefined') return;
  if (!entry.coalesce) { queue.push(entry); scheduleFlush(); return; }
  const key = `${entry.area}|${entry.docId || ''}|${entry.action}`;
  const held = pendingMerge.get(key);
  if (held) {
    held.entry.changes = { ...(held.entry.changes || {}), ...(entry.changes || {}) };
    return;
  }
  const timer = setTimeout(() => {
    const h = pendingMerge.get(key);
    pendingMerge.delete(key);
    if (h) { queue.push(h.entry); scheduleFlush(); }
  }, MERGE_WINDOW_MS);
  pendingMerge.set(key, { entry: { ...entry, changes: { ...(entry.changes || {}) } }, timer });
}

/** Send everything now, e.g. when the page is closing. */
export function flushActivity() {
  pendingMerge.forEach(h => { clearTimeout(h.timer); queue.push(h.entry); });
  pendingMerge.clear();
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  send(queue.splice(0, 50), true);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushActivity);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushActivity(); });
}

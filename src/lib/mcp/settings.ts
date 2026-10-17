import { adminDb } from '@/lib/firebase/admin';
import { User } from '@/lib/firebase/schema';

// Company-wide rules for the AI connection, set by admins in Settings → AI access.
// Kept in aiSettings/{companyId}, which only the server writes: the company document itself can be
// edited by any member, so it can't hold a rule that limits members.

export type ConnectLevel = 'none' | 'admins' | 'members' | 'everyone';
export type ChangeLevel = 'admins' | 'members';

export interface AiSettings {
  connect: ConnectLevel; // who may connect an assistant at all
  changes: ChangeLevel; // who may let it make changes (viewers never can)
  updatedAt?: number;
  updatedBy?: string;
}

// Matches how AI access worked before the setting existed
export const DEFAULT_AI_SETTINGS: AiSettings = { connect: 'everyone', changes: 'members' };

export async function getAiSettings(companyId: string): Promise<AiSettings> {
  const snap = await adminDb!.collection('aiSettings').doc(companyId).get();
  const d = snap.data() as Partial<AiSettings> | undefined;
  return {
    connect: (['none', 'admins', 'members', 'everyone'] as const).includes(d?.connect as ConnectLevel) ? (d!.connect as ConnectLevel) : DEFAULT_AI_SETTINGS.connect,
    changes: d?.changes === 'admins' ? 'admins' : DEFAULT_AI_SETTINGS.changes,
    updatedAt: d?.updatedAt,
    updatedBy: d?.updatedBy,
  };
}

export async function saveAiSettings(companyId: string, s: { connect: unknown; changes: unknown }, by: string): Promise<AiSettings> {
  const connect = (['none', 'admins', 'members', 'everyone'] as const).find(v => v === s.connect);
  const changes = (['admins', 'members'] as const).find(v => v === s.changes);
  if (!connect || !changes) throw new Error('Invalid setting.');
  const doc: AiSettings = { connect, changes, updatedAt: Date.now(), updatedBy: by };
  await adminDb!.collection('aiSettings').doc(companyId).set(doc);
  return doc;
}

/** Whether this person may connect an assistant under the company's rules. */
export function mayConnect(s: AiSettings, role: User['role'], isAdmin: boolean): boolean {
  if (isAdmin) return s.connect !== 'none';
  if (s.connect === 'everyone') return true;
  if (s.connect === 'members') return role === 'member';
  return false;
}

/** Whether this person may let an assistant make changes under the company's rules. */
export function mayChange(s: AiSettings, role: User['role'], isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return s.changes === 'members' && role === 'member';
}

export function connectRefusal(s: AiSettings): string {
  return s.connect === 'none'
    ? 'AI access is switched off for this company. An admin can turn it on in Settings → AI access.'
    : s.connect === 'admins'
      ? 'Your company only allows admins to connect AI assistants. Ask an admin to change this in Settings → AI access.'
      : 'Your company only allows admins and members to connect AI assistants. Ask an admin to change this in Settings → AI access.';
}

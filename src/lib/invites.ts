import { Invite } from '@/lib/firebase/schema';

// What a not-yet-signed-in invitee is allowed to see about their invite.
// Served by src/app/api/invites/preview/route.ts — see there for why this
// can't be a direct Firestore read from the client.
export interface InvitePreview {
  email: string;
  role: Invite['role'];
  companyName: string;
}

// Returns null when the invite doesn't exist (already used, revoked or a bad
// link); throws on network/server errors so callers can tell the two apart.
export async function fetchInvitePreview(token: string): Promise<InvitePreview | null> {
  const res = await fetch(`/api/invites/preview?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load invite');
  return res.json();
}

// Unguessable invite token (128 bits from the browser's CSPRNG). Replaces the
// previous Math.random()-based token, which isn't cryptographically random.
export function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

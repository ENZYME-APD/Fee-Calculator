import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { Company, User } from '@/lib/firebase/schema';

// Credentials for the AI connection (MCP): personal access keys made in Settings → AI access, and
// OAuth access tokens issued when someone signs in from Claude, ChatGPT or another client.
//
// Firestore never holds a credential itself, only an HMAC of it keyed with a secret derived from the
// server's service-account key. The general company-scoped Firestore rule would otherwise let any
// signed-in client plant a document; without the server secret nobody can produce a credential that
// matches a stored hash. These documents carry no companyId, so clients can't read them either. The
// company and role are read from users/{uid} (server-written) on every request, so removing someone
// or changing their role takes effect immediately.

export const KEY_PREFIX = 'fcmcp_'; // personal access key
export const ACCESS_PREFIX = 'fcat_'; // OAuth access token
export const REFRESH_PREFIX = 'fcrt_'; // OAuth refresh token
export const CODE_PREFIX = 'fcac_'; // OAuth authorization code
export const MAX_TOKENS_PER_USER = 10;
export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export interface McpTokenDoc {
  uid: string;
  name: string;
  hint: string; // first characters of the key, to recognise it in the list
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
  canWrite?: boolean; // keys made before changes were possible are read-only
  kind?: 'key' | 'oauth';
  grantId?: string; // oauth: the sign-in this token belongs to
  expiresAt?: number; // oauth access tokens expire
}

export interface OAuthGrantDoc {
  uid: string;
  clientId: string;
  clientName: string;
  canWrite: boolean;
  refreshHash: string;
  refreshExpiresAt: number;
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
}

export interface McpContext {
  uid: string;
  email: string;
  displayName: string;
  companyId: string;
  role: User['role'];
  isAdmin: boolean;
  canWrite: boolean; // the credential allows changes and the role is not viewer
  clientName: string; // key name or signed-in app, for the change log
  company: Company;
}

function hmacKey(): string {
  const secret = process.env.MCP_TOKEN_SECRET || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!secret) throw new Error('Server not configured');
  return crypto.createHash('sha256').update(`feecalc-mcp-token:${secret}`).digest('hex');
}

export function hashToken(token: string): string {
  return crypto.createHmac('sha256', hmacKey()).update(token).digest('hex');
}

export function generateToken(prefix: string = KEY_PREFIX): string {
  return prefix + crypto.randomBytes(32).toString('base64url');
}

export function randomId(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function subscriptionAllows(company: Company): boolean {
  const s = company.subscriptionStatus;
  if (s === 'active' || s === 'lifetime') return true;
  if (s === 'trialing') return !company.trialEndsAt || Date.now() <= company.trialEndsAt;
  return false;
}

export type ResolveResult = { ok: true; ctx: McpContext } | { ok: false; status: number; message: string };

/** Turns a key or access token into the caller's company, role and permissions, or says why it can't. */
export async function resolveToken(token: string | null | undefined): Promise<ResolveResult> {
  if (!adminDb) return { ok: false, status: 500, message: 'Server not configured' };
  if (!token || !(token.startsWith(KEY_PREFIX) || token.startsWith(ACCESS_PREFIX)) || token.length < 20) {
    return { ok: false, status: 401, message: 'Sign in to Fee Calculator, or use an access key from Settings → AI access.' };
  }
  const ref = adminDb.collection('mcpTokens').doc(hashToken(token));
  const snap = await ref.get();
  const data = snap.data() as McpTokenDoc | undefined;
  if (!snap.exists || !data || data.revokedAt) {
    return { ok: false, status: 401, message: 'This access key or sign-in is not valid or has been revoked.' };
  }
  if (data.expiresAt && Date.now() > data.expiresAt) {
    return { ok: false, status: 401, message: 'The sign-in has expired. Refresh it or sign in again.' };
  }
  if (data.kind === 'oauth' && data.grantId) {
    const grant = (await adminDb.collection('oauthGrants').doc(data.grantId).get()).data() as OAuthGrantDoc | undefined;
    if (!grant || grant.revokedAt) return { ok: false, status: 401, message: 'This app has been disconnected from Fee Calculator.' };
  }

  const user = (await adminDb.collection('users').doc(data.uid).get()).data() as User | undefined;
  if (!user?.companyId) return { ok: false, status: 403, message: 'The account behind this key no longer belongs to a company.' };

  const companySnap = await adminDb.collection('companies').doc(user.companyId).get();
  if (!companySnap.exists) return { ok: false, status: 403, message: 'Company not found.' };
  const company = { id: companySnap.id, ...(companySnap.data() as Company) };
  if (!subscriptionAllows(company)) {
    return { ok: false, status: 402, message: 'The Fee Calculator subscription for this company is not active. Renew it under Billing to use the AI connection.' };
  }

  // Record use, at most every 10 minutes
  if (!data.lastUsedAt || Date.now() - data.lastUsedAt > 10 * 60 * 1000) {
    ref.update({ lastUsedAt: Date.now() }).catch(() => {});
    if (data.grantId) adminDb.collection('oauthGrants').doc(data.grantId).update({ lastUsedAt: Date.now() }).catch(() => {});
  }

  const email = (user.email || '').toLowerCase();
  const isAdmin = user.role === 'admin' || email.endsWith('@weareenzyme.com');
  return {
    ok: true,
    ctx: {
      uid: data.uid,
      email,
      displayName: user.displayName || email,
      companyId: user.companyId,
      role: user.role,
      // Same rule as the app: admins of the company, plus Enzyme superadmins
      isAdmin,
      canWrite: !!data.canWrite && (user.role !== 'viewer' || isAdmin),
      clientName: data.name,
      company,
    },
  };
}

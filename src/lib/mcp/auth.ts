import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { Company, User } from '@/lib/firebase/schema';

// Personal access keys for the AI connection (MCP).
//
// A key is shown to the user once. Firestore only keeps an HMAC of it, keyed with a secret derived
// from the server's service-account key. That matters because the general company-scoped Firestore
// rule lets signed-in clients create documents: without the server secret nobody can produce a key
// that matches a stored hash, so a planted mcpTokens document is useless. Token documents carry no
// companyId, so the same rule never lets clients read them; the company and role are looked up
// from users/{uid} (server-written) on every request, so removing someone or changing their role
// takes effect immediately.

export const TOKEN_PREFIX = 'fcmcp_';
export const MAX_TOKENS_PER_USER = 10;

export interface McpTokenDoc {
  uid: string;
  name: string;
  hint: string; // first characters of the key, to recognise it in the list
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
}

export interface McpContext {
  uid: string;
  email: string;
  companyId: string;
  role: User['role'];
  isAdmin: boolean;
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

export function generateToken(): string {
  return TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
}

export function subscriptionAllows(company: Company): boolean {
  const s = company.subscriptionStatus;
  if (s === 'active' || s === 'lifetime') return true;
  if (s === 'trialing') return !company.trialEndsAt || Date.now() <= company.trialEndsAt;
  return false;
}

export type ResolveResult = { ok: true; ctx: McpContext } | { ok: false; status: number; message: string };

/** Turns an access key into the caller's company and role, or says why it can't. */
export async function resolveToken(token: string | null | undefined): Promise<ResolveResult> {
  if (!adminDb) return { ok: false, status: 500, message: 'Server not configured' };
  if (!token || !token.startsWith(TOKEN_PREFIX) || token.length < 20) {
    return { ok: false, status: 401, message: 'Missing or malformed access key. Create one in Fee Calculator → Settings → AI access.' };
  }
  const ref = adminDb.collection('mcpTokens').doc(hashToken(token));
  const snap = await ref.get();
  const data = snap.data() as McpTokenDoc | undefined;
  if (!snap.exists || !data || data.revokedAt) {
    return { ok: false, status: 401, message: 'This access key is not valid or has been revoked.' };
  }

  const userSnap = await adminDb.collection('users').doc(data.uid).get();
  const user = userSnap.data() as User | undefined;
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
  }

  const email = (user.email || '').toLowerCase();
  return {
    ok: true,
    ctx: {
      uid: data.uid,
      email,
      companyId: user.companyId,
      role: user.role,
      // Same rule as the app: admins of the company, plus Enzyme superadmins
      isAdmin: user.role === 'admin' || email.endsWith('@weareenzyme.com'),
      company,
    },
  };
}

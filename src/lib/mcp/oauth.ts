import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import {
  ACCESS_PREFIX, ACCESS_TOKEN_TTL_MS, CODE_PREFIX, McpTokenDoc, OAuthGrantDoc, REFRESH_PREFIX, REFRESH_TOKEN_TTL_MS,
  generateToken, hashToken, randomId,
} from './auth';

// OAuth 2.1 for the MCP server, as MCP clients (Claude, ChatGPT, Cursor, Claude Code…) expect it:
// discovery metadata, dynamic client registration, authorization code + PKCE (S256 only), and
// rotating refresh tokens. Users approve on /oauth/authorize while signed in to Fee Calculator.

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Protocol-Version',
};

export function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS, ...extra },
  });
}

export const oauthError = (error: string, description: string, status = 400) =>
  jsonResponse({ error, error_description: description }, status);

export function originOf(req: Request): string {
  return new URL(req.url).origin;
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: ['read', 'write'],
    bearer_methods_supported: ['header'],
    resource_name: 'Fee Calculator',
    resource_documentation: `${origin}/docs#ai-access`,
  };
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    revocation_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['read', 'write'],
    service_documentation: `${origin}/docs#ai-access`,
  };
}

// ---------- clients ----------

export interface OAuthClientDoc {
  name: string;
  redirectUris: string[];
  createdAt: number;
}

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const BLOCKED_SCHEMES = new Set(['javascript:', 'data:', 'file:', 'vbscript:', 'about:', 'blob:']);

/** https anywhere, http only to the user's own machine, or an app's own scheme (cursor://…). */
export function redirectUriAllowed(uri: string): boolean {
  let u: URL;
  try { u = new URL(uri); } catch { return false; }
  if (u.hash) return false;
  if (u.protocol === 'https:') return true;
  if (u.protocol === 'http:') return LOOPBACK.has(u.hostname);
  return !BLOCKED_SCHEMES.has(u.protocol);
}

/** Exact match, except that a loopback redirect may use any port (RFC 8252 §7.3). */
export function redirectMatches(registered: string[], uri: string): boolean {
  if (registered.includes(uri)) return true;
  let u: URL;
  try { u = new URL(uri); } catch { return false; }
  if (u.protocol !== 'http:' || !LOOPBACK.has(u.hostname)) return false;
  return registered.some(r => {
    try {
      const v = new URL(r);
      return v.protocol === 'http:' && v.hostname === u.hostname && v.pathname === u.pathname && v.search === u.search;
    } catch { return false; }
  });
}

export async function getClient(clientId: string): Promise<OAuthClientDoc | null> {
  if (!clientId || clientId.length > 100) return null;
  const snap = await adminDb!.collection('oauthClients').doc(clientId).get();
  return snap.exists ? (snap.data() as OAuthClientDoc) : null;
}

export async function registerClient(body: Record<string, unknown>): Promise<{ id: string; doc: OAuthClientDoc } | { error: string }> {
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === 'string') : [];
  if (!uris.length || uris.length > 10) return { error: 'Give between 1 and 10 redirect_uris.' };
  const bad = uris.find(u => !redirectUriAllowed(u) || u.length > 500);
  if (bad) return { error: `redirect_uri not allowed: ${bad}` };
  const name = (typeof body.client_name === 'string' && body.client_name.trim() ? body.client_name.trim() : 'AI assistant').slice(0, 80);
  const id = `fcc_${randomId(16)}`;
  const doc: OAuthClientDoc = { name, redirectUris: uris, createdAt: Date.now() };
  await adminDb!.collection('oauthClients').doc(id).set(doc);
  return { id, doc };
}

// ---------- authorization codes ----------

interface CodeDoc {
  clientId: string;
  uid: string;
  redirectUri: string;
  codeChallenge: string;
  canWrite: boolean;
  scope: string;
  expiresAt: number;
}

export async function issueCode(p: Omit<CodeDoc, 'expiresAt'>): Promise<string> {
  const code = generateToken(CODE_PREFIX);
  await adminDb!.collection('oauthCodes').doc(hashToken(code)).set({ ...p, expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

const s256 = (verifier: string) => crypto.createHash('sha256').update(verifier).digest('base64url');

// ---------- tokens ----------

async function issueTokens(grantId: string, grant: OAuthGrantDoc) {
  const access = generateToken(ACCESS_PREFIX);
  const refresh = `${REFRESH_PREFIX}${grantId}.${randomId(32)}`;
  const tokenDoc: McpTokenDoc = {
    uid: grant.uid, name: grant.clientName, hint: access.slice(0, 12), createdAt: Date.now(),
    canWrite: grant.canWrite, kind: 'oauth', grantId, expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };
  await adminDb!.collection('mcpTokens').doc(hashToken(access)).set(tokenDoc);
  await adminDb!.collection('oauthGrants').doc(grantId).update({
    refreshHash: hashToken(refresh), refreshExpiresAt: Date.now() + REFRESH_TOKEN_TTL_MS, lastUsedAt: Date.now(),
  });
  return {
    access_token: access,
    token_type: 'Bearer',
    expires_in: Math.round(ACCESS_TOKEN_TTL_MS / 1000),
    refresh_token: refresh,
    scope: grant.canWrite ? 'read write' : 'read',
  };
}

type TokenResult = { ok: true; body: unknown } | { ok: false; error: string; description: string; status?: number };

export async function exchangeCode(params: URLSearchParams): Promise<TokenResult> {
  const code = params.get('code') || '';
  const clientId = params.get('client_id') || '';
  const redirectUri = params.get('redirect_uri') || '';
  const verifier = params.get('code_verifier') || '';
  if (!code.startsWith(CODE_PREFIX) || !verifier) return { ok: false, error: 'invalid_request', description: 'code and code_verifier are required.' };

  const db = adminDb!;
  const ref = db.collection('oauthCodes').doc(hashToken(code));
  // Single use: read and delete together
  const data = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    tx.delete(ref);
    return snap.data() as CodeDoc;
  });
  if (!data || Date.now() > data.expiresAt) return { ok: false, error: 'invalid_grant', description: 'The authorization code is invalid or has expired.' };
  if (data.clientId !== clientId) return { ok: false, error: 'invalid_grant', description: 'The code was issued to another client.' };
  if (redirectUri && data.redirectUri !== redirectUri) return { ok: false, error: 'invalid_grant', description: 'redirect_uri does not match.' };
  if (s256(verifier) !== data.codeChallenge) return { ok: false, error: 'invalid_grant', description: 'PKCE verification failed.' };

  const client = await getClient(clientId);
  if (!client) return { ok: false, error: 'invalid_client', description: 'Unknown client.', status: 401 };

  const grantRef = db.collection('oauthGrants').doc();
  const grant: OAuthGrantDoc = {
    uid: data.uid, clientId, clientName: client.name, canWrite: data.canWrite,
    refreshHash: '', refreshExpiresAt: 0, createdAt: Date.now(),
  };
  await grantRef.set(grant);
  return { ok: true, body: await issueTokens(grantRef.id, grant) };
}

export async function refreshTokens(params: URLSearchParams): Promise<TokenResult> {
  const token = params.get('refresh_token') || '';
  const clientId = params.get('client_id') || '';
  const m = token.match(/^fcrt_([A-Za-z0-9]{10,40})\./);
  if (!m) return { ok: false, error: 'invalid_grant', description: 'Malformed refresh token.' };
  const ref = adminDb!.collection('oauthGrants').doc(m[1]);
  const grant = (await ref.get()).data() as OAuthGrantDoc | undefined;
  if (!grant || grant.revokedAt || grant.refreshHash !== hashToken(token) || Date.now() > grant.refreshExpiresAt) {
    return { ok: false, error: 'invalid_grant', description: 'The refresh token is invalid, expired or has been revoked. Sign in again.' };
  }
  if (clientId && clientId !== grant.clientId) return { ok: false, error: 'invalid_grant', description: 'The token was issued to another client.' };
  return { ok: true, body: await issueTokens(ref.id, grant) };
}

/** Disconnects an app: the grant and every access token it issued stop working. */
export async function revokeGrant(grantId: string, uid?: string): Promise<boolean> {
  const ref = adminDb!.collection('oauthGrants').doc(grantId);
  const grant = (await ref.get()).data() as OAuthGrantDoc | undefined;
  if (!grant || (uid && grant.uid !== uid)) return false;
  await ref.update({ revokedAt: Date.now(), refreshHash: '' });
  return true;
}

/** RFC 7009: accepts an access or refresh token and revokes the whole sign-in it belongs to. */
export async function revokeToken(token: string): Promise<void> {
  if (token.startsWith(REFRESH_PREFIX)) {
    const m = token.match(/^fcrt_([A-Za-z0-9]{10,40})\./);
    if (m) {
      const grant = (await adminDb!.collection('oauthGrants').doc(m[1]).get()).data() as OAuthGrantDoc | undefined;
      if (grant && grant.refreshHash === hashToken(token)) await revokeGrant(m[1]);
    }
    return;
  }
  if (token.startsWith(ACCESS_PREFIX)) {
    const ref = adminDb!.collection('mcpTokens').doc(hashToken(token));
    const doc = (await ref.get()).data() as McpTokenDoc | undefined;
    if (doc?.grantId) await revokeGrant(doc.grantId);
  }
}

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getClient, issueCode, redirectMatches } from '@/lib/mcp/oauth';
import { connectRefusal, getAiSettings, mayChange, mayConnect } from '@/lib/mcp/settings';

// Backs the consent page at /oauth/authorize.
// GET: checks the app and its return address before anything is shown.
// POST: the signed-in user approves or declines; returns where to send the browser back to.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hostOf(uri: string): string {
  try { const u = new URL(uri); return u.host || u.protocol; } catch { return uri; }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const client = await getClient(q.get('client_id') || '');
  const redirectUri = q.get('redirect_uri') || '';
  if (!client) return NextResponse.json({ error: 'This app is not registered with Fee Calculator. Start the connection again from the app.' }, { status: 400 });
  if (!redirectMatches(client.redirectUris, redirectUri)) return NextResponse.json({ error: 'The return address does not match what this app registered.' }, { status: 400 });
  return NextResponse.json({ client_name: client.name, redirect_host: hostOf(redirectUri) });
}

export async function POST(req: Request) {
  if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const h = req.headers.get('authorization') || '';
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(h.slice(7))).uid; } catch { return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }); }

  const body = await req.json().catch(() => ({}));
  const clientId = String(body.client_id || '');
  const redirectUri = String(body.redirect_uri || '');
  const state = typeof body.state === 'string' ? body.state : '';
  const client = await getClient(clientId);
  if (!client || !redirectMatches(client.redirectUris, redirectUri)) return NextResponse.json({ error: 'Invalid app or return address.' }, { status: 400 });

  const back = new URL(redirectUri);
  if (state) back.searchParams.set('state', state);
  if (body.approve !== true) {
    back.searchParams.set('error', 'access_denied');
    return NextResponse.json({ redirect_to: back.toString() });
  }
  if (body.response_type !== 'code' || body.code_challenge_method !== 'S256' || typeof body.code_challenge !== 'string' || body.code_challenge.length < 43) {
    back.searchParams.set('error', 'invalid_request');
    back.searchParams.set('error_description', 'PKCE with S256 is required.');
    return NextResponse.json({ redirect_to: back.toString() });
  }

  const user = (await adminDb.collection('users').doc(uid).get()).data();
  if (!user?.companyId) return NextResponse.json({ error: 'Your account is not part of a company.' }, { status: 403 });
  const isAdmin = user.role === 'admin' || String(user.email || '').toLowerCase().endsWith('@weareenzyme.com');
  const rules = await getAiSettings(user.companyId);
  if (!mayConnect(rules, user.role, isAdmin)) return NextResponse.json({ error: connectRefusal(rules) }, { status: 403 });
  const canWrite = body.allow_changes === true && (user.role !== 'viewer' || isAdmin) && mayChange(rules, user.role, isAdmin);

  const code = await issueCode({
    clientId, uid, redirectUri, codeChallenge: body.code_challenge, canWrite,
    scope: canWrite ? 'read write' : 'read',
  });
  back.searchParams.set('code', code);
  return NextResponse.json({ redirect_to: back.toString() });
}

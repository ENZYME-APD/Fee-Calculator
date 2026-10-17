import { CORS, jsonResponse, oauthError, registerClient } from '@/lib/mcp/oauth';

// RFC 7591 dynamic client registration: MCP clients register themselves before the first sign-in.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return oauthError('invalid_client_metadata', 'Send the client metadata as JSON.');
  const result = await registerClient(body as Record<string, unknown>);
  if ('error' in result) return oauthError('invalid_redirect_uri', result.error);
  return jsonResponse({
    client_id: result.id,
    client_id_issued_at: Math.floor(result.doc.createdAt / 1000),
    client_name: result.doc.name,
    redirect_uris: result.doc.redirectUris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  }, 201);
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

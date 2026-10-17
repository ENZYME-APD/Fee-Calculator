import { CORS, exchangeCode, jsonResponse, oauthError, refreshTokens } from '@/lib/mcp/oauth';

// OAuth token endpoint: authorization code (with PKCE) and refresh token grants.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function paramsOf(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)]));
  }
  return new URLSearchParams(await req.text());
}

export async function POST(req: Request) {
  const params = await paramsOf(req);
  const grantType = params.get('grant_type');
  const result =
    grantType === 'authorization_code' ? await exchangeCode(params)
    : grantType === 'refresh_token' ? await refreshTokens(params)
    : null;
  if (!result) return oauthError('unsupported_grant_type', 'Use authorization_code or refresh_token.');
  if (!result.ok) return oauthError(result.error, result.description, result.status || 400);
  return jsonResponse(result.body);
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

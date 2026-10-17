import { CORS, revokeToken } from '@/lib/mcp/oauth';

// RFC 7009 token revocation (signing out from the AI client).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const params = new URLSearchParams(await req.text());
  const token = params.get('token');
  if (token) await revokeToken(token).catch(() => {});
  return new Response(null, { status: 200, headers: CORS }); // always 200, per the RFC
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

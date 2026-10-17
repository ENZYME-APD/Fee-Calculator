import { CORS, authorizationServerMetadata, jsonResponse, originOf } from '@/lib/mcp/oauth';

// RFC 8414: the OAuth endpoints MCP clients use to sign in.
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return jsonResponse(authorizationServerMetadata(originOf(req)), 200, { 'Cache-Control': 'public, max-age=3600' });
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

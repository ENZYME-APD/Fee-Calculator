import { bearerFrom, getResponse, handleMcpPost, optionsResponse } from '@/lib/mcp/server';

// MCP endpoint for AI clients that can send a header: Authorization: Bearer <access key>
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handleMcpPost(req, bearerFrom(req));
}
export function GET() { return getResponse(); }
export function OPTIONS() { return optionsResponse(); }

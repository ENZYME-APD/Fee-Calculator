import { bearerFrom, getResponse, handleMcpPost, optionsResponse } from '@/lib/mcp/server';

// MCP endpoint with the access key in the address, for clients that only take a URL
// (for example custom connectors in Claude). A header key, if sent, wins.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return handleMcpPost(req, bearerFrom(req) || decodeURIComponent(key));
}
export function GET() { return getResponse(); }
export function OPTIONS() { return optionsResponse(); }

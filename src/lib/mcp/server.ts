import { resolveToken } from './auth';
import { ChangeError } from './changes';
import { CompanyData, ToolError, toolsFor } from './tools';
import { WRITE_TOOLS } from './writeTools';

// A small, stateless MCP server over Streamable HTTP: each POST carries JSON-RPC messages and gets
// a plain JSON reply. No sessions or server-sent events are needed.

const SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER_INFO = { name: 'fee-calculator', title: 'Fee Calculator', version: '1.1.0' };
const ABOUT =
  'Fee Calculator holds an architecture practice\'s fee proposals (projects split into phases with team hours and costs), ' +
  'payment schedules, team, overheads and a cash-flow forecast. Call get_company_overview first. ' +
  'Amounts are in the company currency it returns.';
const READ_ONLY = ' This connection is read-only.';
const CAN_WRITE =
  ' This connection can also make changes. Before changing anything, tell the user exactly what you will change and wait for them to confirm. ' +
  'Each change returns a change_id; undo_change reverts it.';
const DESTRUCTIVE = new Set(['remove_direct_cost', 'remove_forecast_entry', 'set_payment_schedule', 'undo_change']);

/** Where OAuth clients learn how to sign in, sent with every 401. */
export function resourceMetadataUrl(req: Request): string {
  return `${new URL(req.url).origin}/.well-known/oauth-protected-resource`;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
};

type RpcId = string | number | null;
interface RpcMessage { jsonrpc?: string; id?: RpcId; method?: string; params?: Record<string, unknown> }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const rpcError = (id: RpcId, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

export function bearerFrom(req: Request): string | null {
  const h = req.headers.get('authorization') || '';
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : null;
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS });
}

export function getResponse() {
  return new Response(
    JSON.stringify({ name: 'Fee Calculator MCP server', usage: 'POST JSON-RPC messages here with your access key. See Settings → AI access in Fee Calculator.' }),
    { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS', ...CORS } },
  );
}

export async function handleMcpPost(req: Request, token: string | null): Promise<Response> {
  let body: unknown;
  try { body = await req.json(); } catch { return json(rpcError(null, -32700, 'Parse error'), 400); }

  const auth = await resolveToken(token);
  if (!auth.ok) {
    const id = !Array.isArray(body) && body && typeof body === 'object' ? ((body as RpcMessage).id ?? null) : null;
    const res = json(rpcError(id, -32001, auth.message), auth.status);
    if (auth.status === 401) {
      res.headers.set('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl(req)}"`);
      res.headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate');
    }
    return res;
  }
  const ctx = auth.ctx;
  const data = new CompanyData(ctx.companyId);
  const tools = toolsFor(ctx, WRITE_TOOLS);

  const handle = async (msg: RpcMessage): Promise<unknown | null> => {
    const isRequest = msg && msg.id !== undefined && msg.id !== null;
    if (!msg || typeof msg.method !== 'string') return isRequest ? rpcError(msg?.id ?? null, -32600, 'Invalid request') : null;
    if (!isRequest) return null; // notifications (initialized, cancelled…) need no reply
    const id = msg.id as RpcId;

    switch (msg.method) {
      case 'initialize': {
        const asked = String(msg.params?.protocolVersion || '');
        return {
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo: SERVER_INFO,
            instructions: ABOUT + (ctx.canWrite ? CAN_WRITE : READ_ONLY),
          },
        };
      }
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };
      case 'tools/list':
        return {
          jsonrpc: '2.0', id,
          result: {
            tools: tools.map(t => ({
              name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
              annotations: {
                title: t.title,
                readOnlyHint: !t.writes || t.name === 'list_recent_changes',
                destructiveHint: DESTRUCTIVE.has(t.name),
                idempotentHint: !t.writes,
                openWorldHint: false,
              },
            })),
          },
        };
      case 'tools/call': {
        const name = String(msg.params?.name || '');
        const tool = tools.find(t => t.name === name);
        if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);
        const args = (msg.params?.arguments && typeof msg.params.arguments === 'object' ? msg.params.arguments : {}) as Record<string, unknown>;
        try {
          const result = await tool.run(args, ctx, data);
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false } };
        } catch (e) {
          const known = e instanceof ToolError || e instanceof ChangeError;
          const message = known ? (e as Error).message : 'Something went wrong in Fee Calculator. Check list_recent_changes before retrying a change.';
          if (!known) console.error('MCP tool error', name, e);
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: message }], isError: true } };
        }
      }
      case 'resources/list':
        return { jsonrpc: '2.0', id, result: { resources: [] } };
      case 'prompts/list':
        return { jsonrpc: '2.0', id, result: { prompts: [] } };
      default:
        return rpcError(id, -32601, `Method not found: ${msg.method}`);
    }
  };

  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map(m => handle(m as RpcMessage)))).filter(r => r !== null);
    return replies.length ? json(replies) : new Response(null, { status: 202, headers: CORS });
  }
  const reply = await handle(body as RpcMessage);
  return reply === null ? new Response(null, { status: 202, headers: CORS }) : json(reply);
}

"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Copy, Check, KeyRound, Trash2, AlertCircle, Undo2, Unplug, PencilLine, Eye } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/AuthContext';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

interface KeyRow { id: string; name: string; hint: string; createdAt: number; lastUsedAt: number | null; canWrite: boolean }
interface AppRow { id: string; name: string; createdAt: number; lastUsedAt: number | null; canWrite: boolean }
interface ChangeRow { id: string; summary: string; who: string; via: string; createdAt: number; undoneAt: number | null; canUndo: boolean }

async function api(path: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Request failed') as Error & { data?: unknown }; e.data = data; throw e; }
  return data;
}

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">{label}</div>
      <div className="flex items-start gap-2">
        <code className="flex-1 min-w-0 text-xs bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg px-3 py-2 font-mono text-ink-800 dark:text-ink-200 break-all whitespace-pre-wrap">{value}</code>
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
          className="shrink-0 p-2 rounded-lg border border-ink-200 dark:border-ink-800 text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={14} className="text-positive-600 dark:text-positive-400" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (ts: number) => new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Access({ canWrite }: { canWrite: boolean }) {
  return canWrite ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-700 dark:text-warning-300 bg-warning-50 dark:bg-warning-950/40 rounded-full px-2 py-0.5"><PencilLine size={11} /> Can make changes</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-600 dark:text-ink-300 bg-ink-100 dark:bg-ink-800 rounded-full px-2 py-0.5"><Eye size={11} /> Read-only</span>
  );
}

const Section = ({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-bold text-ink-900 dark:text-ink-50">{title}</h3>
    {hint && <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 mb-3">{hint}</p>}
    <div className={hint ? '' : 'mt-3'}>{children}</div>
  </div>
);

export function AIAccessTab() {
  const { dbUser, user } = useAuth();
  const isViewer = dbUser?.role === 'viewer' && !user?.email?.toLowerCase().endsWith('@weareenzyme.com');
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [keyCanWrite, setKeyCanWrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://feecalc.weareenzyme.com';

  const setState = (d: { keys?: KeyRow[]; apps?: AppRow[] }) => { if (d.keys) setKeys(d.keys); if (d.apps) setApps(d.apps); };

  const load = useCallback(async () => {
    try {
      const [k, c] = await Promise.all([api('/api/mcp-keys'), api('/api/mcp-changes')]);
      setState(k); setChanges(c.changes);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const d = await api('/api/mcp-keys', 'POST', { name: name || 'AI assistant', canWrite: keyCanWrite && !isViewer });
      setState(d); setNewToken(d.token); setName(''); setKeyCanWrite(false);
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  };

  const revokeKey = async (k: KeyRow) => {
    if (!window.confirm(`Revoke "${k.name}"? Any assistant using it loses access straight away.`)) return;
    setError('');
    try { setState(await api(`/api/mcp-keys?id=${encodeURIComponent(k.id)}`, 'DELETE')); } catch (err) { setError((err as Error).message); }
  };

  const disconnect = async (a: AppRow) => {
    if (!window.confirm(`Disconnect ${a.name}? It loses access straight away and has to sign in again to reconnect.`)) return;
    setError('');
    try { setState(await api(`/api/mcp-keys?app=${encodeURIComponent(a.id)}`, 'DELETE')); } catch (err) { setError((err as Error).message); }
  };

  const undo = async (c: ChangeRow) => {
    if (!window.confirm(`Undo this change?\n\n${c.summary}`)) return;
    setError('');
    try { setChanges((await api('/api/mcp-changes', 'POST', { id: c.id })).changes); }
    catch (err) {
      setError((err as Error).message);
      const d = (err as Error & { data?: { changes?: ChangeRow[] } }).data;
      if (d?.changes) setChanges(d.changes);
    }
  };

  const token = newToken || '<your access key>';

  return (
    <div className="space-y-10">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
          <Bot size={20} className="text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">AI access</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">
            Connect Claude, ChatGPT, Cursor or any assistant that supports MCP, and ask it about your projects, fees, payment schedules and team, or have it draft and update proposals for you.
            It sees what you can see: salaries, rates, overheads and the forecast only if you are an admin.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-negative-700 dark:text-negative-300 bg-negative-50 dark:bg-negative-950/40 border border-negative-200 dark:border-negative-900 rounded-xl px-3 py-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <Section title="Connect by signing in (recommended)" hint="Add this address in your assistant. It opens Fee Calculator so you can sign in and choose whether it may make changes.">
        <div className="space-y-4">
          <CopyBox label="Server address" value={`${origin}/api/mcp`} />
          <ul className="text-sm text-ink-700 dark:text-ink-300 space-y-1.5 list-disc pl-5">
            <li><span className="font-semibold">Claude (web and desktop):</span> Settings → Connectors → Add custom connector, paste the address, then click Connect.</li>
            <li><span className="font-semibold">ChatGPT and other assistants:</span> add a custom MCP connector or server with this address, and sign in when asked.</li>
            <li><span className="font-semibold">Claude Code:</span> run <code className="text-xs font-mono bg-ink-100 dark:bg-ink-800 rounded px-1">claude mcp add --transport http fee-calculator {origin}/api/mcp</code>, then <code className="text-xs font-mono bg-ink-100 dark:bg-ink-800 rounded px-1">/mcp</code> to sign in.</li>
          </ul>
        </div>
      </Section>

      <Section title="Connected apps">
        {loading ? <p className="text-sm text-ink-500 dark:text-ink-400">Loading…</p> : apps.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">No apps connected yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800 border border-ink-200 dark:border-ink-800 rounded-xl">
            {apps.map(a => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium text-ink-900 dark:text-ink-100">{a.name}</span><Access canWrite={a.canWrite} /></div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">Connected {fmtDate(a.createdAt)} · {a.lastUsedAt ? `last used ${fmtDate(a.lastUsedAt)}` : 'not used yet'}</div>
                </div>
                <button type="button" onClick={() => disconnect(a)} className="text-negative-600 dark:text-negative-400 hover:underline text-xs flex items-center gap-1 font-medium">
                  <Unplug size={13} /> Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent AI changes" hint={dbUser?.role === 'admin' ? 'Changes anyone in your company made through an assistant. Undo restores what was there before, unless it has been edited since.' : 'Changes you made through an assistant. Undo restores what was there before, unless it has been edited since.'}>
        {loading ? <p className="text-sm text-ink-500 dark:text-ink-400">Loading…</p> : changes.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">No changes yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800 border border-ink-200 dark:border-ink-800 rounded-xl">
            {changes.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${c.undoneAt ? 'line-through text-ink-500 dark:text-ink-400' : 'text-ink-900 dark:text-ink-100'}`}>{c.summary}</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">{fmtTime(c.createdAt)} · {c.who} via {c.via}{c.undoneAt ? ` · undone ${fmtTime(c.undoneAt)}` : ''}</div>
                </div>
                {c.canUndo && (
                  <button type="button" onClick={() => undo(c)} className="text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-100 text-xs flex items-center gap-1 font-medium">
                    <Undo2 size={13} /> Undo
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Access keys" hint="For assistants that can't sign in. Paste the key into the assistant's settings instead.">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Key name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cursor on my laptop" maxLength={60} className={`${fieldClass} w-full`} />
          </div>
          <label className={`flex items-center gap-2 text-sm pb-2 ${isViewer ? 'opacity-50' : 'cursor-pointer'} text-ink-700 dark:text-ink-300`}>
            <input type="checkbox" checked={keyCanWrite && !isViewer} disabled={isViewer} onChange={e => setKeyCanWrite(e.target.checked)} /> Allow changes
          </label>
          <PrimaryButton type="submit" disabled={busy}><KeyRound size={14} /> {busy ? 'Creating…' : 'Create access key'}</PrimaryButton>
        </form>

        {newToken && (
          <div className="rounded-2xl border border-warning-300 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/30 p-4 space-y-3 mb-4">
            <p className="text-sm font-semibold text-warning-800 dark:text-warning-200">Copy your key now. For your security it won&apos;t be shown again.</p>
            <CopyBox label="Access key" value={newToken} />
            <CopyBox label="Claude Code" value={`claude mcp add --transport http fee-calculator ${origin}/api/mcp --header "Authorization: Bearer ${token}"`} />
            <CopyBox label="Cursor and other MCP clients" value={JSON.stringify({ mcpServers: { 'fee-calculator': { url: `${origin}/api/mcp`, headers: { Authorization: `Bearer ${token}` } } } }, null, 2)} />
            <CopyBox label="Address with the key in it, for clients that only take a URL" value={`${origin}/api/mcp/${token}`} />
            <div className="flex justify-end"><SecondaryButton type="button" onClick={() => setNewToken(null)}>Done</SecondaryButton></div>
          </div>
        )}

        {!loading && keys.length > 0 && (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800 border border-ink-200 dark:border-ink-800 rounded-xl">
            {keys.map(k => (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium text-ink-900 dark:text-ink-100 truncate">{k.name}</span><Access canWrite={k.canWrite} /></div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">
                    <span className="font-mono">{k.hint}…</span> · created {fmtDate(k.createdAt)} · {k.lastUsedAt ? `last used ${fmtDate(k.lastUsedAt)}` : 'never used'}
                  </div>
                </div>
                <button type="button" onClick={() => revokeKey(k)} className="text-negative-600 dark:text-negative-400 hover:underline text-xs flex items-center gap-1 font-medium">
                  <Trash2 size={13} /> Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">
          Treat a key like a password: anyone with it can do what the key allows. Revoke it if it leaks or you stop using that assistant.
        </p>
      </Section>
    </div>
  );
}

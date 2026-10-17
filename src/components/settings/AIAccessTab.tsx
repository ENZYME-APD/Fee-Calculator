"use client";
import React, { useEffect, useState } from 'react';
import { Bot, Copy, Check, KeyRound, Trash2, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { PrimaryButton, SecondaryButton, fieldClass } from '@/components/ui/Button';

interface KeyRow { id: string; name: string; hint: string; createdAt: number; lastUsedAt: number | null }

async function call(method: 'GET' | 'POST' | 'DELETE', body?: unknown, query = '') {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/mcp-keys${query}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
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

export function AIAccessTab() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://feecalc.weareenzyme.com';

  useEffect(() => {
    call('GET').then(d => setKeys(d.keys)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const d = await call('POST', { name: name || 'AI assistant' });
      setKeys(d.keys); setNewToken(d.token); setName('');
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  };

  const revoke = async (k: KeyRow) => {
    if (!window.confirm(`Revoke "${k.name}"? Any AI assistant using it loses access straight away.`)) return;
    setError('');
    try { const d = await call('DELETE', undefined, `?id=${encodeURIComponent(k.id)}`); setKeys(d.keys); }
    catch (err) { setError((err as Error).message); }
  };

  const token = newToken || '<your access key>';

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
          <Bot size={20} className="text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">AI access</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">
            Connect Claude, ChatGPT, Cursor or any assistant that supports MCP, and ask it about your projects, fees, payment schedules and team.
            Access is read-only and follows your role: salaries, rates, overheads and the forecast are only shared if you are an admin.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-negative-700 dark:text-negative-300 bg-negative-50 dark:bg-negative-950/40 border border-negative-200 dark:border-negative-900 rounded-xl px-3 py-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Key name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Claude on my laptop" maxLength={60} className={`${fieldClass} w-full`} />
        </div>
        <PrimaryButton type="submit" disabled={busy}><KeyRound size={14} /> {busy ? 'Creating…' : 'Create access key'}</PrimaryButton>
      </form>

      {newToken && (
        <div className="rounded-2xl border border-warning-300 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-warning-800 dark:text-warning-200">Copy your key now. For your security it won&apos;t be shown again.</p>
          <CopyBox label="Access key" value={newToken} />
          <div className="flex justify-end"><SecondaryButton type="button" onClick={() => setNewToken(null)}>Done</SecondaryButton></div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-50 mb-3">Your keys</h3>
        {loading ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">No keys yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800 border border-ink-200 dark:border-ink-800 rounded-xl">
            {keys.map(k => (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink-900 dark:text-ink-100 truncate">{k.name}</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">
                    <span className="font-mono">{k.hint}…</span> · created {fmtDate(k.createdAt)} · {k.lastUsedAt ? `last used ${fmtDate(k.lastUsedAt)}` : 'never used'}
                  </div>
                </div>
                <button type="button" onClick={() => revoke(k)} className="text-negative-600 dark:text-negative-400 hover:underline text-xs flex items-center gap-1 font-medium">
                  <Trash2 size={13} /> Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-50">Connect your assistant</h3>
        <div className="space-y-1.5">
          <p className="text-sm text-ink-700 dark:text-ink-300"><span className="font-semibold">Claude (web and desktop):</span> Settings → Connectors → Add custom connector, and paste this address.</p>
          <CopyBox label="Connector address" value={`${origin}/api/mcp/${token}`} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-ink-700 dark:text-ink-300"><span className="font-semibold">Claude Code:</span> run this in a terminal.</p>
          <CopyBox label="Command" value={`claude mcp add --transport http fee-calculator ${origin}/api/mcp --header "Authorization: Bearer ${token}"`} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-ink-700 dark:text-ink-300"><span className="font-semibold">Cursor and other MCP clients:</span> add this server to the client&apos;s MCP settings.</p>
          <CopyBox label="Configuration" value={JSON.stringify({ mcpServers: { 'fee-calculator': { url: `${origin}/api/mcp`, headers: { Authorization: `Bearer ${token}` } } } }, null, 2)} />
        </div>
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Treat the key like a password: anyone with it can read what you can read. Revoke it here if it leaks or you stop using that assistant.
        </p>
      </div>
    </div>
  );
}

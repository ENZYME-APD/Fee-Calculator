"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/config';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';

// Consent screen for AI assistants connecting over MCP with OAuth. Reached from the assistant;
// the user signs in to Fee Calculator if needed, then allows or declines.

function Consent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, dbUser, dbCompany, loading } = useAuth();
  const [client, setClient] = useState<{ client_name: string; redirect_host: string } | null>(null);
  const [error, setError] = useState('');
  const [allowChanges, setAllowChanges] = useState(true);
  const [busy, setBusy] = useState(false);

  const clientId = params.get('client_id') || '';
  const redirectUri = params.get('redirect_uri') || '';
  const isViewer = dbUser?.role === 'viewer' && !user?.email?.toLowerCase().endsWith('@weareenzyme.com');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (params.get('response_type') !== 'code') { setError('This sign-in request is not supported (response_type must be code).'); return; }
    fetch(`/api/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setClient(d); })
      .catch(e => setError(e.message || 'Could not check this app.'));
  }, [loading, user, clientId, redirectUri, params, router]);

  const decide = async (approve: boolean) => {
    setBusy(true); setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const r = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          approve,
          allow_changes: allowChanges && !isViewer,
          client_id: clientId,
          redirect_uri: redirectUri,
          state: params.get('state') || '',
          response_type: params.get('response_type'),
          code_challenge: params.get('code_challenge'),
          code_challenge_method: params.get('code_challenge_method'),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      window.location.href = d.redirect_to;
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-3xl shadow-sm p-8">
        <div className="mb-6">
          <img src="/logo-dark.png" alt="Enzyme APD" className="h-8 w-auto dark:hidden" />
          <img src="/logo-light.png" alt="Enzyme APD" className="h-8 w-auto hidden dark:block" />
        </div>

        {error ? (
          <div className="flex items-start gap-2 text-sm text-negative-700 dark:text-negative-300 bg-negative-50 dark:bg-negative-950/40 border border-negative-200 dark:border-negative-900 rounded-xl px-3 py-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        ) : !client ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600" /></div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                <Bot size={22} className="text-accent-600 dark:text-accent-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-ink-900 dark:text-ink-50 leading-tight">{client.client_name} wants to connect</h1>
                <p className="text-xs text-ink-500 dark:text-ink-400 truncate">Returns to {client.redirect_host}</p>
              </div>
            </div>

            <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
              It will act as <span className="font-semibold">{dbUser?.displayName || user?.email}</span> in{' '}
              <span className="font-semibold">{dbCompany?.name || 'your company'}</span>, and see what you can see: projects, fees, payment schedules and the team
              {dbUser?.role === 'admin' ? ', plus salaries, overheads and the forecast, because you are an admin' : ''}.
            </p>

            <label className={`flex items-start gap-3 rounded-xl border p-3 mb-6 ${isViewer ? 'border-ink-200 dark:border-ink-800 opacity-60' : 'border-ink-200 dark:border-ink-700 cursor-pointer'}`}>
              <input type="checkbox" className="mt-1" checked={allowChanges && !isViewer} disabled={isViewer} onChange={e => setAllowChanges(e.target.checked)} />
              <span className="text-sm">
                <span className="font-semibold text-ink-900 dark:text-ink-100">Allow it to make changes</span>
                <span className="block text-ink-500 dark:text-ink-400 text-xs mt-0.5">
                  {isViewer
                    ? 'Viewers can only connect read-only.'
                    : 'Create and edit projects, phases, hours, costs and payment schedules (and the forecast, for admins). Every change is logged and can be undone in Settings → AI access.'}
                </span>
              </span>
            </label>

            <div className="flex items-center justify-end gap-2">
              <SecondaryButton type="button" disabled={busy} onClick={() => decide(false)}>Cancel</SecondaryButton>
              <PrimaryButton type="button" disabled={busy} onClick={() => decide(true)}><ShieldCheck size={14} /> {busy ? 'Connecting…' : 'Allow'}</PrimaryButton>
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-5">You can disconnect it at any time in Settings → AI access.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={null}>
      <Consent />
    </Suspense>
  );
}

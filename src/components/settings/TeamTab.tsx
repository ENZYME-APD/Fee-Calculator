"use client";
import React, { useState, useEffect } from 'react';
import { Company, Invite } from '@/lib/firebase/schema';
import { createInvite, getInvitesByCompany, deleteInvite } from '@/lib/firebase/db';
import { Mail, Copy, Check, Trash2, Users } from 'lucide-react';

export function TeamTab({ company }: { company: Company }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    const data = await getInvitesByCompany();
    setInvites(data);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await createInvite({
        email,
        companyId: company.id!,
        role,
        token,
        createdAt: Date.now()
      });
      setEmail('');
      await loadInvites();
    } catch (error) {
      console.error(error);
      alert("Failed to create invite");
    }
    setLoading(false);
  };

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;
    await deleteInvite(id);
    await loadInvites();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team Management</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Invite team members to join {company.name}.</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Send New Invite</h3>
        <form onSubmit={handleInvite} className="flex gap-4">
          <div className="flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
              required
            />
          </div>
          <div className="w-48">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Mail size={16} />
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </form>
      </div>

      {invites.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Pending Invites</h3>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Users size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{invite.email}</p>
                    <p className="text-xs text-slate-500">Role: <span className="capitalize">{invite.role}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(invite.token)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {copied === invite.token ? <Check size={14} /> : <Copy size={14} />}
                    {copied === invite.token ? 'Copied' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => handleDelete(invite.id!)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

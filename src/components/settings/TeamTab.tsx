"use client";
import React, { useState, useEffect } from 'react';
import { Company, Invite, User } from '@/lib/firebase/schema';
import { createInvite, getInvitesByCompany, deleteInvite, getUsersByCompany, updateUser, removeUserFromCompany } from '@/lib/firebase/db';
import { Mail, Copy, Check, Trash2, Users, Edit2, Save, KeyRound } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/AuthContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { generateInviteToken } from '@/lib/invites';

export function TeamTab({ company }: { company: Company }) {
  const { dbUser } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDeleteInviteId, setConfirmDeleteInviteId] = useState<string | null>(null);
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | null>(null);
  // Users and billing: 5 included, extra admins/members billed after confirmation (viewers free)
  const [seats, setSeats] = useState<{ included: number; used: number; capacity: number | null; mode: string; interval: 'month' | 'year' | null; extraPrice: number | null; extraPaid: number } | null>(null);
  const [seatPrompt, setSeatPrompt] = useState<{ what: string; run: () => Promise<void> } | null>(null);
  const [seatNote, setSeatNote] = useState('');

  const seatsApi = async (method: 'GET' | 'POST', body?: unknown) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/seats', { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || 'Could not check your plan.');
    return d;
  };
  const loadSeats = async () => { try { setSeats(await seatsApi('GET')); } catch { setSeats(null); } };
  const paying = (r: string) => r === 'admin' || r === 'member';
  const fmtPrice = (n: number) => `$${n.toFixed(2)}`;
  /** Runs an action that adds a paying user; if the plan is full, asks first and adds a paid user. */
  const withSeat = async (what: string, run: () => Promise<void>) => {
    const s = seats || await seatsApi('GET').catch(() => null);
    if (s && s.mode === 'subscription' && s.capacity !== null && s.used + 1 > s.capacity) {
      setSeatPrompt({ what, run });
      return;
    }
    await run();
  };
  const confirmSeat = async () => {
    if (!seatPrompt) return;
    const { run } = seatPrompt;
    setSeatPrompt(null);
    try {
      setSeats(await seatsApi('POST', { action: 'add', count: 1 }));
      await run();
    } catch (e) { alert((e as Error).message); }
  };
  /** After someone leaves or becomes a viewer, stop paying for unused extra users. */
  const trimSeats = async () => {
    if (seats?.mode !== 'subscription') return;
    try {
      const before = seats.extraPaid;
      const next = await seatsApi('POST', { action: 'trim' });
      setSeats(next);
      if (next.extraPaid < before && seats.extraPrice) setSeatNote(`Your plan now pays for ${next.extraPaid} extra user${next.extraPaid === 1 ? '' : 's'}; ${fmtPrice(seats.extraPrice * (before - next.extraPaid))} per ${seats.interval} less from your next invoice (prorated).`);
    } catch { /* not critical */ }
  };

  const loadData = async () => {
    const [invitesData, usersData] = await Promise.all([
      getInvitesByCompany(),
      getUsersByCompany()
    ]);
    setInvites(invitesData);
    setActiveUsers(usersData);
  };

  useEffect(() => {
    loadData();
    loadSeats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const send = async () => {
      setLoading(true);
      try {
        const token = generateInviteToken();
        await createInvite({
          email,
          companyId: company.id!,
          role,
          token,
          createdAt: Date.now()
        });
        setEmail('');
        await loadData();
        await loadSeats();
      } catch (error) {
        console.error(error);
        alert("Failed to create invite");
      }
      setLoading(false);
    };
    if (paying(role)) await withSeat(`Inviting ${email} as ${role}`, send);
    else await send();
  };

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteInviteId(id);
  };

  const executeDeleteInvite = async () => {
    if (!confirmDeleteInviteId) return;
    await deleteInvite(confirmDeleteInviteId);
    await loadData();
    setConfirmDeleteInviteId(null);
    await trimSeats();
  };

  const handleEditName = (user: User) => {
    setEditingUserId(user.uid!);
    setEditName(user.displayName || '');
  };

  const handleSaveName = async (uid: string) => {
    await updateUser(uid, { displayName: editName });
    setEditingUserId(null);
    await loadData();
  };

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (uid === dbUser?.uid && newRole !== 'admin') {
      alert("You cannot remove your own admin privileges.");
      return;
    }
    const current = activeUsers.find(u => u.uid === uid)?.role;
    const apply = async () => {
      await updateUser(uid, { role: newRole });
      await loadData();
      await loadSeats();
      if (current && paying(current) && !paying(newRole)) await trimSeats();
    };
    if (current && !paying(current) && paying(newRole)) await withSeat(`Making this viewer ${newRole === 'admin' ? 'an admin' : 'a member'}`, apply);
    else await apply();
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      await sendPasswordResetEmail(auth, userEmail);
      alert(`Password reset email sent to ${userEmail}`);
    } catch (e: any) {
      alert(`Error sending reset email: ${e.message}`);
    }
  };

  const handleDeleteUser = (uid: string) => {
    if (uid === dbUser?.uid) {
      alert("You cannot remove yourself from the company.");
      return;
    }
    setConfirmRemoveUserId(uid);
  };

  const executeRemoveUser = async () => {
    if (!confirmRemoveUserId) return;
    await removeUserFromCompany(confirmRemoveUserId);
    await loadData();
    setConfirmRemoveUserId(null);
    await trimSeats();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50">Team management</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm mt-1">Invite team members to join {company.name}.</p>
      </div>

      {seats && (
        <div className="rounded-2xl border border-ink-200 dark:border-ink-800 px-4 py-3 text-sm text-ink-700 dark:text-ink-300 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span><span className="font-semibold text-ink-900 dark:text-ink-100">{seats.used}</span> paying user{seats.used === 1 ? '' : 's'} (admins, members and their pending invites)</span>
          {seats.mode === 'subscription' && (
            <span className="text-ink-500 dark:text-ink-400">
              {seats.included} included{seats.extraPaid > 0 ? ` + ${seats.extraPaid} extra at ${fmtPrice(seats.extraPrice || 0)} per ${seats.interval}` : ''}. Viewers are free.
            </span>
          )}
          {seats.mode === 'trial' && <span className="text-ink-500 dark:text-ink-400">Unlimited users during your trial. Plans include {seats.included}; extra users are $1.99 a month or $7.99 a year. Viewers are free.</span>}
          {seats.mode === 'lifetime' && <span className="text-ink-500 dark:text-ink-400">Unlimited users on your plan.</span>}
        </div>
      )}
      {seatNote && <p className="text-xs text-positive-700 dark:text-positive-300 -mt-4">{seatNote}</p>}

      <div className="bg-ink-50 dark:bg-ink-800/50 rounded-2xl p-6 border border-ink-200 dark:border-ink-700">
        <h3 className="text-sm font-bold text-ink-700 dark:text-ink-300 mb-4">Send new invite</h3>
        <form onSubmit={handleInvite} className="flex gap-4">
          <div className="flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 focus:ring-2 focus:ring-accent-500/20 outline-none"
              required
            />
          </div>
          <div className="w-48">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 focus:ring-2 focus:ring-accent-500/20 outline-none"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Mail size={16} />
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </form>
      </div>

      {activeUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-700 dark:text-ink-300 mb-4">Active team members</h3>
          <div className="space-y-3">
            {activeUsers.map(user => (
              <div key={user.uid} className="flex items-center justify-between p-4 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                    <Users size={18} className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="flex flex-col gap-1 w-1/3 min-w-[200px]">
                    {editingUserId === user.uid ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 text-sm border border-ink-300 dark:border-ink-600 rounded bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSaveName(user.uid!)} className="text-positive-600 hover:text-positive-700">
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-ink-900 dark:text-ink-50">{user.displayName || 'No Name'}</p>
                        <button onClick={() => handleEditName(user)} className="text-ink-500 hover:text-accent-600">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-ink-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid!, e.target.value as any)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-300 outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  
                  <Tooltip content="Send Password Reset" position="top">
                    <button
                      onClick={() => handleResetPassword(user.email)}
                      className="p-1.5 text-ink-500 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors"
                    >
                      <KeyRound size={16} />
                    </button>
                  </Tooltip>
                  
                  {user.uid !== dbUser?.uid && (
                    <Tooltip content="Remove from workspace" position="top">
                      <button
                        onClick={() => handleDeleteUser(user.uid!)}
                        className="p-1.5 text-ink-500 hover:text-negative-500 hover:bg-negative-50 dark:hover:bg-negative-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-700 dark:text-ink-300 mb-4">Pending invites</h3>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl opacity-75">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center">
                    <Users size={18} className="text-ink-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ink-900 dark:text-ink-50">{invite.email}</p>
                    <p className="text-xs text-ink-500">Role: <span className="capitalize">{invite.role}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(invite.token)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-accent-600 bg-accent-50 dark:bg-accent-900/30 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/50 transition-colors"
                  >
                    {copied === invite.token ? <Check size={14} /> : <Copy size={14} />}
                    {copied === invite.token ? 'Copied' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => handleDelete(invite.id!)}
                    className="p-1.5 text-ink-500 hover:text-negative-500 hover:bg-negative-50 dark:hover:bg-negative-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!seatPrompt}
        title="Add a paid user?"
        message={seatPrompt && seats ? `${seatPrompt.what}. Your plan includes ${seats.included} users and all ${seats.capacity} paid places are in use, so this adds one extra user at ${fmtPrice(seats.extraPrice || 0)} per ${seats.interval}, charged pro rata for the rest of this billing period on your next invoice. Viewers stay free.` : ''}
        confirmText={seats?.extraPrice ? `Add user (+${fmtPrice(seats.extraPrice)}/${seats.interval})` : 'Add user'}
        onConfirm={confirmSeat}
        onCancel={() => setSeatPrompt(null)}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteInviteId}
        title="Revoke Invite"
        message="Are you sure you want to revoke this invite? The link will no longer work."
        confirmText="Revoke Invite"
        onConfirm={executeDeleteInvite}
        onCancel={() => setConfirmDeleteInviteId(null)}
      />
      <ConfirmModal
        isOpen={!!confirmRemoveUserId}
        title="Remove User"
        message="Are you sure you want to remove this user from the company? They will lose access to all company projects and data."
        confirmText="Remove User"
        onConfirm={executeRemoveUser}
        onCancel={() => setConfirmRemoveUserId(null)}
      />
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { Company, Invite, User } from '@/lib/firebase/schema';
import { createInvite, getInvitesByCompany, deleteInvite, getUsersByCompany, updateUser, removeUserFromCompany } from '@/lib/firebase/db';
import { Mail, Copy, Check, Trash2, Users, Edit2, Save, KeyRound } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/AuthContext';
import { Tooltip } from '@/components/ui/Tooltip';

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
  }, []);

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
      await loadData();
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
    await loadData();
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
    await updateUser(uid, { role: newRole });
    await loadData();
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      await sendPasswordResetEmail(auth, userEmail);
      alert(`Password reset email sent to ${userEmail}`);
    } catch (e: any) {
      alert(`Error sending reset email: ${e.message}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === dbUser?.uid) {
      alert("You cannot remove yourself from the company.");
      return;
    }
    if (!confirm('Are you sure you want to remove this user from the company?')) return;
    await removeUserFromCompany(uid);
    await loadData();
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

      {activeUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Active Team Members</h3>
          <div className="space-y-3">
            {activeUsers.map(user => (
              <div key={user.uid} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1 w-1/3 min-w-[200px]">
                    {editingUserId === user.uid ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSaveName(user.uid!)} className="text-emerald-600 hover:text-emerald-700">
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{user.displayName || 'No Name'}</p>
                        <button onClick={() => handleEditName(user)} className="text-slate-400 hover:text-blue-600">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid!, e.target.value as any)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  
                  <Tooltip content="Send Password Reset" position="top">
                    <button
                      onClick={() => handleResetPassword(user.email)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <KeyRound size={16} />
                    </button>
                  </Tooltip>
                  
                  {user.uid !== dbUser?.uid && (
                    <Tooltip content="Remove from workspace" position="top">
                      <button
                        onClick={() => handleDeleteUser(user.uid!)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
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
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Pending Invites</h3>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl opacity-75">
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

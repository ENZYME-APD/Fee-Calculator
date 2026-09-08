"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllCompaniesForSuperadmin, getAllUsersForSuperadmin, updateCompany } from '@/lib/firebase/db';
import { ShieldAlert, Building2, Users as UsersIcon, Calendar, Activity } from 'lucide-react';
import { Company, User } from '@/lib/firebase/schema';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function SuperadminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const handleExtendTrial = async (companyId: string) => {
    setIsUpdating(companyId);
    try {
      const newEndsAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
      await updateCompany(companyId, { subscriptionStatus: 'trialing', trialEndsAt: newEndsAt, tier: 'pro' });
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'trialing', trialEndsAt: newEndsAt, tier: 'pro' } : c));
    } catch (err: any) {
      setError("Failed to extend trial: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSetLifetime = async (companyId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Grant Lifetime Access',
      message: 'Are you sure you want to grant lifetime PRO access to this company?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsUpdating(companyId);
        try {
          await updateCompany(companyId, { subscriptionStatus: 'lifetime', tier: 'pro' });
          setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'lifetime', tier: 'pro' } : c));
        } catch (err: any) {
          setError("Failed to set lifetime: " + err.message);
        } finally {
          setIsUpdating(null);
        }
      }
    });
  };

  const handleRevoke = async (companyId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Revoke Access',
      message: 'Are you sure you want to revoke access? This will lock the company out of PRO features.',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsUpdating(companyId);
        try {
          await updateCompany(companyId, { subscriptionStatus: 'canceled', tier: 'free' });
          setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'canceled', tier: 'free' as any } : c));
        } catch (err: any) {
          setError("Failed to revoke access: " + err.message);
        } finally {
          setIsUpdating(null);
        }
      }
    });
  };

  const isSuperadmin = user?.email?.toLowerCase().endsWith('@weareenzyme.com');

  useEffect(() => {
    if (!loading) {
      if (!user || !isSuperadmin) {
        router.replace('/overview');
        return;
      }

      const loadData = async () => {
        try {
          const comps = await getAllCompaniesForSuperadmin();
          const usrs = await getAllUsersForSuperadmin();
          setCompanies(comps.sort((a, b) => b.createdAt - a.createdAt));
          setUsers(usrs);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch global data. Check Firestore rules.');
        } finally {
          setIsFetching(false);
        }
      };

      loadData();
    }
  }, [user, loading, isSuperadmin, router]);

  if (loading || isFetching) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSuperadmin) return null; // Fallback before redirect

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="text-rose-500" />
              Superadmin Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Global overview of all registered companies and users.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold max-w-sm">
              {error}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
              <Building2 size={18} />
              <span className="font-semibold text-sm">Total Companies</span>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{companies.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
              <UsersIcon size={18} />
              <span className="font-semibold text-sm">Total Users</span>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{users.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
              <Activity size={18} />
              <span className="font-semibold text-sm">Active Trials</span>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {companies.filter(c => c.subscriptionStatus === 'trialing').length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
              <Calendar size={18} />
              <span className="font-semibold text-sm">Lifetime Accounts</span>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {companies.filter(c => c.subscriptionStatus === 'lifetime').length}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companies.map(company => {
                  const companyUsers = users.filter(u => u.companyId === company.id);
                  const isTrialExpired = company.subscriptionStatus === 'trialing' && company.trialEndsAt && company.trialEndsAt < Date.now();
                  
                  return (
                    <tr key={company.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{company.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{company.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest min-w-[100px]
                          ${company.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                            company.subscriptionStatus === 'trialing' ? (isTrialExpired ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400') :
                            company.subscriptionStatus === 'lifetime' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }
                        `}>
                          {isTrialExpired ? 'Trial Expired' : company.subscriptionStatus}
                        </span>
                        {company.subscriptionStatus === 'trialing' && company.trialEndsAt && !isTrialExpired && (
                          <div className="text-xs text-slate-500 mt-1">
                            Ends: {new Date(company.trialEndsAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {companyUsers.map(u => (
                            <div key={u.uid} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{u.displayName || 'Unknown'}</span>
                              <span className="text-slate-400">({u.email})</span>
                              <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{u.role}</span>
                            </div>
                          ))}
                          {companyUsers.length === 0 && <span className="text-slate-400 italic">No users found</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleExtendTrial(company.id!)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Add 14 days"
                          >
                            +14d Trial
                          </button>
                          <button
                            onClick={() => handleSetLifetime(company.id!)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Grant Lifetime Access"
                          >
                            Lifetime
                          </button>
                          <button
                            onClick={() => handleRevoke(company.id!)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Revoke License"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {companies.length === 0 && !error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No companies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllCompaniesForSuperadmin, getAllUsersForSuperadmin, updateCompany } from '@/lib/firebase/db';
import { ShieldAlert, Building2, Users as UsersIcon, Calendar, Activity } from 'lucide-react';
import { Company, User } from '@/lib/firebase/schema';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { Card } from '@/components/ui/Card';

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
      <div className="flex h-full items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (!isSuperadmin) return null; // Fallback before redirect

  return (
    <div className="flex-1 overflow-y-auto bg-ink-50 dark:bg-ink-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <Card className="flex-row items-center justify-between p-6">
          <div>
            <h1 className="text-[22px] font-bold text-ink-900 dark:text-ink-50 flex items-center gap-2 tracking-tight">
              <ShieldAlert className="text-negative-500" />
              Superadmin Dashboard
            </h1>
            <p className="text-ink-500 dark:text-ink-400 mt-1">
              Global overview of all registered companies and users.
            </p>
          </div>
          {error && (
            <div className="bg-negative-50 text-negative-600 px-4 py-2 rounded-lg text-sm font-semibold max-w-sm">
              {error}
            </div>
          )}
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400 mb-2">
              <Building2 size={18} />
              <span className="font-semibold text-sm">Total companies</span>
            </div>
            <div className="text-3xl font-black text-ink-800 dark:text-ink-100">{companies.length}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400 mb-2">
              <UsersIcon size={18} />
              <span className="font-semibold text-sm">Total users</span>
            </div>
            <div className="text-3xl font-black text-ink-800 dark:text-ink-100">{users.length}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400 mb-2">
              <Activity size={18} />
              <span className="font-semibold text-sm">Active trials</span>
            </div>
            <div className="text-3xl font-black text-ink-800 dark:text-ink-100">
              {companies.filter(c => c.subscriptionStatus === 'trialing').length}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400 mb-2">
              <Calendar size={18} />
              <span className="font-semibold text-sm">Lifetime accounts</span>
            </div>
            <div className="text-3xl font-black text-ink-800 dark:text-ink-100">
              {companies.filter(c => c.subscriptionStatus === 'lifetime').length}
            </div>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/50 text-ink-500 dark:text-ink-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Company name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created date</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {companies.map(company => {
                  const companyUsers = users.filter(u => u.companyId === company.id);
                  const isTrialExpired = company.subscriptionStatus === 'trialing' && company.trialEndsAt && company.trialEndsAt < Date.now();
                  
                  return (
                    <tr key={company.id} className="group hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink-800 dark:text-ink-200">{company.name}</div>
                        <div className="text-xs text-ink-500 font-mono mt-0.5">{company.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded text-xs font-medium capitalize min-w-[100px]
                          ${company.subscriptionStatus === 'active' ? 'bg-positive-100 text-positive-800 dark:bg-positive-900/30 dark:text-positive-400' : 
                            company.subscriptionStatus === 'trialing' ? (isTrialExpired ? 'bg-negative-100 text-negative-800 dark:bg-negative-900/30 dark:text-negative-400' : 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400') :
                            company.subscriptionStatus === 'lifetime' ? 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400' :
                            'bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-300'
                          }
                        `}>
                          {isTrialExpired ? 'Trial Expired' : company.subscriptionStatus}
                        </span>
                        {company.subscriptionStatus === 'trialing' && company.trialEndsAt && !isTrialExpired && (
                          <div className="text-xs text-ink-500 mt-1">
                            Ends: {new Date(company.trialEndsAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ink-600 dark:text-ink-400">
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {companyUsers.map(u => (
                            <div key={u.uid} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-ink-700 dark:text-ink-300">{u.displayName || 'Unknown'}</span>
                              <span className="text-ink-500">({u.email})</span>
                              <span className="text-xs font-medium bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 rounded text-ink-500 capitalize">{u.role}</span>
                            </div>
                          ))}
                          {companyUsers.length === 0 && <span className="text-ink-500 italic">No users found</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleExtendTrial(company.id!)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-accent-900/20 dark:text-accent-400 dark:hover:bg-accent-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Add 14 days"
                          >
                            +14d Trial
                          </button>
                          <button
                            onClick={() => handleSetLifetime(company.id!)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-info-50 text-info-600 hover:bg-info-100 dark:bg-info-900/20 dark:text-info-400 dark:hover:bg-info-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Grant Lifetime Access"
                          >
                            Lifetime
                          </button>
                          <button
                            onClick={() => handleRevoke(company.id!)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-negative-50 text-negative-600 hover:bg-negative-100 dark:bg-negative-900/20 dark:text-negative-400 dark:hover:bg-negative-900/40 rounded font-medium disabled:opacity-50 transition-colors"
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
                    <td colSpan={5} className="px-6 py-8 text-center text-ink-500">
                      No companies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

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

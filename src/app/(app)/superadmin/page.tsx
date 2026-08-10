"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllCompaniesForSuperadmin, getAllUsersForSuperadmin } from '@/lib/firebase/db';
import { ShieldAlert, Building2, Users as UsersIcon, Calendar, Activity } from 'lucide-react';
import { Company, User } from '@/lib/firebase/schema';

export default function SuperadminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companies.map(company => {
                  const companyUsers = users.filter(u => u.companyId === company.id);
                  const isTrialExpired = company.subscriptionStatus === 'trialing' && company.trialEndsAt && company.trialEndsAt < Date.now();
                  
                  return (
                    <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{company.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{company.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
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
                    </tr>
                  );
                })}
                {companies.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No companies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

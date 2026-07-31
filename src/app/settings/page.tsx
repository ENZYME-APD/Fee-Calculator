"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCompany } from '@/lib/firebase/db';
import { Company } from '@/lib/firebase/schema';
import { BillingTab } from '@/components/settings/BillingTab';
import { TeamTab } from '@/components/settings/TeamTab';

export default function SettingsPage() {
  const { dbUser } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'billing' | 'team' | 'general'>('billing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dbUser?.companyId) {
      getCompany(dbUser.companyId).then(data => {
        setCompany(data as Company);
        setLoading(false);
      });
    }
  }, [dbUser]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-full overflow-y-auto">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your company billing, team, and preferences.</p>
      </div>

      <div className="flex gap-8">
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'billing' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Billing & Subscription
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'team' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Team Management
            </button>
          </nav>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {activeTab === 'billing' && company && <BillingTab company={company} />}
          {activeTab === 'team' && company && <TeamTab company={company} />}
        </div>
      </div>
    </div>
  );
}

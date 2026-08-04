"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCompany } from '@/lib/firebase/db';
import { Company } from '@/lib/firebase/schema';
import { TeamTab } from '@/components/settings/TeamTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { PreferencesTab } from '@/components/settings/PreferencesTab';
import { CategoriesTab } from '@/components/settings/CategoriesTab';

export default function SettingsPage() {
  const { dbUser } = useAuth();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'categories' | 'team' | 'security'>('preferences');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'preferences', 'categories', 'team', 'security'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

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
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col h-full overflow-y-auto">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your company preferences, team, and security.</p>
      </div>

      <div className="flex gap-8 items-start">
        <div className="w-64 shrink-0 sticky top-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'preferences' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              General Preferences
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'categories' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Team Categories
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'team' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'security' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Password Management
            </button>
          </nav>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'preferences' && company && <PreferencesTab company={company} />}
          {activeTab === 'categories' && company && <CategoriesTab company={company} />}
          {activeTab === 'team' && company && <TeamTab company={company} />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

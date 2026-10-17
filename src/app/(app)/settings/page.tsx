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
import { AIAccessTab } from '@/components/settings/AIAccessTab';
import { Card, CardBody } from '@/components/ui/Card';

export default function SettingsPage() {
  const { dbUser } = useAuth();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'categories' | 'team' | 'security' | 'ai'>('preferences');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'preferences', 'categories', 'team', 'security', 'ai'].includes(tabParam)) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col h-full overflow-y-auto">
      <div className="mb-6 shrink-0">
        <h1 className="text-[22px] font-bold text-ink-900 dark:text-ink-50 tracking-tight">Settings</h1>
        <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-0.5">Manage your company preferences, team, and security.</p>
      </div>

      <div className="flex gap-8 items-start">
        <div className="w-64 shrink-0 sticky top-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'preferences' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
            >
              General Preferences
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'categories' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
            >
              Team Categories
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'team' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
            >
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'profile' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'ai' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
            >
              AI access
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'security' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
            >
              Password Management
            </button>
          </nav>
        </div>

        <Card className="flex-1">
          <CardBody className="p-6">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'preferences' && company && <PreferencesTab company={company} />}
            {activeTab === 'categories' && company && <CategoriesTab company={company} />}
            {activeTab === 'team' && company && <TeamTab company={company} />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'ai' && <AIAccessTab />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCompany } from '@/lib/firebase/db';
import { Company } from '@/lib/firebase/schema';
import { BillingTab } from '@/components/settings/BillingTab';

export default function BillingPage() {
  const { dbUser } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
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
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-full overflow-y-auto w-full">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Billing & Subscription</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your company's subscription and billing details.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        {company && <BillingTab company={company} />}
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCompany } from '@/lib/firebase/db';
import { Company } from '@/lib/firebase/schema';
import { BillingTab } from '@/components/settings/BillingTab';
import { Card, CardBody } from '@/components/ui/Card';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-full overflow-y-auto w-full">
      <div className="mb-6 shrink-0">
        <h1 className="text-[22px] font-bold text-ink-900 dark:text-ink-50 tracking-tight">Billing & subscription</h1>
        <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-0.5">Manage your company's subscription and billing details.</p>
      </div>

      <Card>
        <CardBody className="p-6">
          {company && <BillingTab company={company} />}
        </CardBody>
      </Card>
    </div>
  );
}

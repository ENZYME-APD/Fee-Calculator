"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCompany } from '@/lib/firebase/db';
import { Company } from '@/lib/firebase/schema';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, dbUser, loading } = useAuth();
  const [companyStatus, setCompanyStatus] = useState<{ status: string, trialEndsAt: number } | null>(null);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && dbUser?.companyId) {
      getCompany(dbUser.companyId).then(data => {
        if (data) {
          setCompanyStatus({ 
            status: data.subscriptionStatus, 
            trialEndsAt: data.trialEndsAt || 0 
          });
        }
        setCheckingCompany(false);
      });
    } else if (!loading) {
      setCheckingCompany(false);
    }
  }, [user, dbUser, loading]);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
    
    // Check trial enforcement
    if (!loading && !checkingCompany && user && companyStatus && pathname !== '/settings') {
      const isTrialExpired = companyStatus.status === 'trialing' && Date.now() > companyStatus.trialEndsAt;
      const isCanceled = companyStatus.status === 'canceled' || companyStatus.status === 'past_due' || companyStatus.status === 'incomplete';
      
      if (isTrialExpired || isCanceled) {
        router.push('/settings');
      }
    }
  }, [user, loading, checkingCompany, companyStatus, router, pathname]);

  if (loading || checkingCompany) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null; 
  }

  if (user && companyStatus && pathname !== '/settings') {
    const isTrialExpired = companyStatus.status === 'trialing' && Date.now() > companyStatus.trialEndsAt;
    const isCanceled = companyStatus.status === 'canceled' || companyStatus.status === 'past_due' || companyStatus.status === 'incomplete';
    
    if (isTrialExpired || isCanceled) {
      return null; // Will redirect in useEffect
    }
  }

  return <>{children}</>;
}

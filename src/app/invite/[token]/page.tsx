"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInviteByToken, getCompany } from '@/lib/firebase/db';
import { Invite, Company } from '@/lib/firebase/schema';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const data = await getInviteByToken(token);
        if (data) {
          setInvite(data);
          const comp = await getCompany(data.companyId);
          setCompany(comp as Company);
        } else {
          setError("This invite link is invalid or has expired.");
        }
      } catch (err) {
        setError("Error verifying invite.");
      }
      setLoading(false);
    };

    fetchInvite();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invite || !company) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle size={48} className="mx-auto text-rose-500 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Invite</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{error || 'Invite not found.'}</p>
          <Link href="/login" className="text-blue-600 hover:underline font-bold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
          You've been invited!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
          You have been invited to join <span className="font-bold text-slate-900 dark:text-slate-200">{company.name}</span> on Enzyme APD Fee Calculator.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Email Address</p>
              <p className="text-xs text-slate-500">{invite.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Role</p>
              <p className="text-xs text-slate-500 capitalize">{invite.role}</p>
            </div>
          </div>
        </div>

        <Link 
          href={`/login?invite=${token}`}
          className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 text-center"
        >
          Accept Invite & Create Account
        </Link>
      </div>
    </div>
  );
}

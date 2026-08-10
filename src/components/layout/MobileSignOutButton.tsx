"use client";
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function MobileSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <button 
      onClick={handleSignOut}
      className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <LogOut size={18} />
      Sign Out & View Website
    </button>
  );
}

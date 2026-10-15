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
      className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-3 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 font-bold rounded-xl shadow-sm hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
    >
      <LogOut size={18} />
      Sign Out & View Website
    </button>
  );
}

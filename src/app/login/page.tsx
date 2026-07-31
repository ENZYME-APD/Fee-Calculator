"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getInviteByToken, deleteInvite } from '@/lib/firebase/db';
import { Invite } from '@/lib/firebase/schema';
import { Building2, Users } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const [inviteData, setInviteData] = useState<Invite | null>(null);

  React.useEffect(() => {
    if (inviteToken) {
      setIsLogin(false);
      getInviteByToken(inviteToken).then(data => {
        if (data) {
          setInviteData(data);
          setEmail(data.email);
        } else {
          setError('This invite link is invalid or expired.');
        }
      });
    }
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/');
      } else {
        // Sign up
        if (!inviteData && !companyName.trim()) throw new Error("Company name is required");
        // 1. Check if we have invite data
        if (inviteData) {
          try {
            // Try to create the user first
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCred.user.uid), {
              email,
              companyId: inviteData.companyId,
              role: inviteData.role
            });
          } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
              // User exists, try signing them in
              const userCred = await signInWithEmailAndPassword(auth, email, password);
              // Update their user doc to join the new company
              await setDoc(doc(db, 'users', userCred.user.uid), {
                email,
                companyId: inviteData.companyId,
                role: inviteData.role
              });
            } else {
              throw err;
            }
          }
          
          // Delete invite regardless
          if (inviteData.id) {
            await deleteInvite(inviteData.id);
          }
        } else {
          // Normal Sign up (No invite)
          if (!companyName.trim()) throw new Error("Company name is required");
          
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          
          // 2. Create the company in Firestore
          const companyId = crypto.randomUUID();
          const isEnzymeEmail = email.toLowerCase().endsWith('@weareenzyme.com');
          
          await setDoc(doc(db, 'companies', companyId), {
            name: companyName,
            subscriptionStatus: isEnzymeEmail ? 'lifetime' : 'trialing',
            trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
            createdAt: Date.now()
          });

          // 3. Create the user doc linked to the company
          await setDoc(doc(db, 'users', userCred.user.uid), {
            email,
            companyId,
            role: 'admin'
          });
        }
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl">
            {inviteData ? <Users size={32} className="text-white" /> : <Building2 size={32} className="text-white" />}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          {isResetting ? 'Reset Password' : isLogin ? 'Welcome back' : (inviteData ? 'Accept your invite' : 'Create your workspace')}
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          {isResetting ? 'Enter your email to receive a reset link.' : isLogin ? 'Sign in to access your fee proposals.' : (inviteData ? `Create a password for ${email}` : 'Start your 7-day free trial today.')}
        </p>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium mb-6 text-center">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-sm font-medium mb-6 text-center">
            Password reset email sent! Check your inbox.
          </div>
        )}

        {!isResetting ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !inviteData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input 
                type="text" 
                required 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                placeholder="e.g. Enzyme APD"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              required 
              disabled={!!inviteData}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:opacity-50"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              {isLogin && (
                <button type="button" onClick={() => { setIsResetting(true); setError(''); setResetSent(false); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Forgot password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : (inviteData ? 'Accept Invite & Join' : 'Start Free Trial'))}
          </button>
        </form>

        {!inviteData && !isResetting && (
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        )}
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || resetSent}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="mt-6 text-center text-sm">
              <button 
                type="button" 
                onClick={() => { setIsResetting(false); setError(''); setResetSent(false); }}
                className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200"
              >
                ← Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

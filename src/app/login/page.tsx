"use client";
import React, { useState, Suspense } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getInviteByToken, deleteInvite, bootstrapCompanyData } from '@/lib/firebase/db';
import { Invite } from '@/lib/firebase/schema';
import { Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const isSignupParam = searchParams.get('signup') === 'true';
  const [isLogin, setIsLogin] = useState(!isSignupParam);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
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
        router.push('/dashboard');
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
              displayName,
              companyId: inviteData.companyId,
              role: inviteData.role
            });
            await updateProfile(userCred.user, { displayName });
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

          await updateProfile(userCred.user, { displayName });

          // 3. Create the user doc linked to the company
          await setDoc(doc(db, 'users', userCred.user.uid), {
            email,
            displayName,
            companyId,
            role: 'admin'
          });

          // 4. Bootstrap sample data
          await bootstrapCompanyData(companyId, userCred.user.uid);
        }
        router.push('/dashboard');
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        if (inviteData) {
          await setDoc(userDocRef, {
            email: user.email,
            companyId: inviteData.companyId,
            role: inviteData.role
          }, { merge: true });
          if (inviteData.id) await deleteInvite(inviteData.id);
        }
        router.push('/dashboard');
      } else {
        if (inviteData) {
          await setDoc(userDocRef, {
            email: user.email,
            companyId: inviteData.companyId,
            role: inviteData.role
          });
          if (inviteData.id) await deleteInvite(inviteData.id);
        } else {
          const cName = companyName.trim() || `${user.displayName || 'My'} Workspace`;
          const companyId = crypto.randomUUID();
          const isEnzymeEmail = user.email?.toLowerCase().endsWith('@weareenzyme.com');
          
          await setDoc(doc(db, 'companies', companyId), {
            name: cName,
            subscriptionStatus: isEnzymeEmail ? 'lifetime' : 'trialing',
            trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            createdAt: Date.now()
          });

          await setDoc(userDocRef, {
            email: user.email,
            companyId,
            role: 'admin'
          });

          await bootstrapCompanyData(companyId, user.uid);
        }
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl">
            {inviteData ? <Users size={32} className="text-white" /> : <Building2 size={32} className="text-white" />}
          </div>
        </div>
        
        {!inviteData && !isResetting && (
          <div className="flex p-1 mb-8 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-colors",
                isLogin ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-colors",
                !isLogin ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              Create Workspace
            </button>
          </div>
        )}
        
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
          {!isLogin && !inviteData && !inviteToken && (
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
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                placeholder="John Doe"
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Or continue with</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
            Google
          </button>
        </form>


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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

import React, { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setSuccess(`Password reset email sent to ${auth.currentUser.email}.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email.');
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) {
      setError('You must be logged in to change your password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // 2. Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect current password.');
      } else {
        setError(err.message || 'Failed to update password.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50 flex items-center gap-2">
          <Lock size={20} className="text-ink-500" />
          Security Settings
        </h2>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Manage your password and security preferences.</p>
      </div>

      <div className="bg-ink-50 dark:bg-ink-900/50 rounded-xl border border-ink-200 dark:border-ink-800 p-6">
        <h3 className="text-lg font-bold text-ink-800 dark:text-ink-200 mb-4">Change password</h3>
        
        {error && (
          <div className="bg-negative-50 dark:bg-negative-900/30 border border-negative-200 dark:border-negative-800/50 text-negative-600 dark:text-negative-400 p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-positive-50 dark:bg-positive-900/30 border border-positive-200 dark:border-positive-800/50 text-positive-600 dark:text-positive-400 p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300">Current password</label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                disabled={loading}
                className="text-xs text-accent-600 dark:text-accent-400 hover:underline font-medium disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
            <input 
              type="password" 
              required 
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-50 rounded-lg focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">New password</label>
            <input 
              type="password" 
              required 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-50 rounded-lg focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Confirm new password</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-50 rounded-lg focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-ink-900 dark:bg-accent-600 hover:bg-ink-800 dark:hover:bg-accent-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

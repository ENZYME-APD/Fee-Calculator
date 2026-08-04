import React, { useState, useEffect } from 'react';
import { updateProfile, deleteUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { deleteAccountData } from '@/lib/firebase/db';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export function ProfileTab() {
  const { dbUser, companyId } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.currentUser?.displayName) {
      setDisplayName(auth.currentUser.displayName);
    } else if (dbUser?.displayName) {
      setDisplayName(dbUser.displayName);
    }
  }, [dbUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !dbUser) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(auth.currentUser, { displayName });
      await updateDoc(doc(db, 'users', dbUser.uid), { displayName });
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
    setLoading(false);
  };
  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !dbUser || !companyId) return;
    
    setDeleting(true);
    setError('');
    
    try {
      // First delete all the Firestore data
      await deleteAccountData(companyId, dbUser.uid);
      
      // Then delete the auth user
      await deleteUser(auth.currentUser);
      
      // The auth state change listener will automatically kick them to /login
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('For security reasons, please log out and log back in before deleting your account.');
      } else {
        setError(err.message || 'Failed to delete account.');
      }
      setShowDeleteConfirm(false);
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <User size={20} className="text-blue-600" />
          My Profile
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your personal details.</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <input 
            type="text" 
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
          <input 
            type="email" 
            value={auth.currentUser?.email || ''}
            disabled
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-500 rounded-xl outline-none cursor-not-allowed"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !displayName.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-500 flex items-center gap-2 mb-2">
          <Trash2 size={20} />
          Danger Zone
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-2xl">
          Once you delete your account, there is no going back. Please be certain. 
          If you are the last user in your company, this action will also permanently delete all company data, including projects, team members, and allocations.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white font-bold py-2.5 px-6 rounded-xl transition-colors border border-red-600/20 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? This action cannot be undone."
        confirmText="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

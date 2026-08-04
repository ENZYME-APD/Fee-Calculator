import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export function ProfileTab() {
  const { dbUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="space-y-8">
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
    </div>
  );
}

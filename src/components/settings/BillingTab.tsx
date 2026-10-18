"use client";
import React, { useState } from 'react';
import { Company } from '@/lib/firebase/schema';
import { CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase/config';

export function BillingTab({ company }: { company: Company }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating checkout");
    }
    setLoading(null);
  };

  const [portalLoading, setPortalLoading] = useState(false);
  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      alert(data.error || 'Could not open billing.');
    } catch {
      alert('Could not open billing.');
    }
    setPortalLoading(false);
  };

  const isTrial = company.subscriptionStatus === 'trialing';
  const isCanceled = company.subscriptionStatus === 'canceled' || company.subscriptionStatus === 'past_due';
  const isActive = company.subscriptionStatus === 'active' || company.subscriptionStatus === 'lifetime';
  
  const daysLeft = company.trialEndsAt 
    ? Math.max(0, Math.ceil((company.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50">Subscription plan</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm mt-1">Manage your billing cycle and payment methods.</p>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-4 ${
        isActive ? 'bg-positive-50 dark:bg-positive-950/30 border-positive-200 dark:border-positive-800' :
        isTrial && daysLeft > 0 ? 'bg-accent-50 dark:bg-accent-950/30 border-accent-200 dark:border-accent-800' :
        'bg-negative-50 dark:bg-negative-950/30 border-negative-200 dark:border-negative-800'
      }`}>
        {isActive ? (
          <CheckCircle2 className="text-positive-600 dark:text-positive-400 mt-0.5" />
        ) : isTrial && daysLeft > 0 ? (
          <AlertCircle className="text-accent-600 dark:text-accent-400 mt-0.5" />
        ) : (
          <AlertCircle className="text-negative-600 dark:text-negative-400 mt-0.5" />
        )}
        
        <div>
          <h3 className={`font-bold ${
            isActive ? 'text-positive-900 dark:text-positive-100' :
            isTrial && daysLeft > 0 ? 'text-accent-900 dark:text-accent-100' :
            'text-negative-900 dark:text-negative-100'
          }`}>
            {isActive ? (company.subscriptionStatus === 'lifetime' ? 'Lifetime Access' : 'Active Subscription') : 
             isTrial && daysLeft > 0 ? `Trial active (${daysLeft} days left)` : 
             'Subscription Required'}
          </h3>
          <p className={`text-sm mt-1 ${
            isActive ? 'text-positive-700 dark:text-positive-300' :
            isTrial && daysLeft > 0 ? 'text-accent-700 dark:text-accent-300' :
            'text-negative-700 dark:text-negative-300'
          }`}>
            {isActive ? (company.subscriptionStatus === 'lifetime' ? 'Your account has been granted permanent free access.' : 'Your subscription is active and billing automatically.') : 
             isTrial && daysLeft > 0 ? 'Upgrade now to ensure uninterrupted access.' : 
             'Your trial has expired. Please choose a plan below to regain access.'}
          </p>
        </div>
      </div>

      {/* Pricing Options */}
      {!isActive && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Monthly */}
          <div className="border border-ink-200 dark:border-ink-800 rounded-2xl p-6 hover:border-accent-500 transition-colors">
            <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50">Monthly plan</h3>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink-900 dark:text-ink-50">$9.99</span>
              <span className="text-ink-500 font-medium">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-ink-600 dark:text-ink-300">
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> Unlimited projects</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> 5 users included, viewers free</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> Extra users $1.99 per user per month</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> Full export/import</li>
            </ul>
            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!)}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-ink-900 hover:bg-ink-800 dark:bg-ink-100 dark:hover:bg-white text-white dark:text-ink-900 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ? 'Loading...' : 'Subscribe monthly'}
            </button>
            <p className="text-center text-xs text-ink-500 mt-4 font-medium">
              Launch offer: code <span className="font-bold text-ink-700 dark:text-ink-300">LAUNCH50</span> at checkout for 50% off your first 6 months
            </p>
          </div>

          {/* Yearly */}
          <div className="border-2 border-accent-600 rounded-2xl p-6 relative bg-accent-50/50 dark:bg-accent-900/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-600 text-white px-3 py-1 text-xs font-bold rounded-full">
              Save 42%
            </div>
            <h3 className="text-lg font-bold text-accent-900 dark:text-accent-100">Yearly plan</h3>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink-900 dark:text-ink-50">$69</span>
              <span className="text-ink-500 font-medium">/year</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-ink-600 dark:text-ink-300">
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> All monthly features, 5 users included</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> Extra users $7.99 per user per year</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> Priority support</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-positive-500"/> 5 months free compared with monthly</li>
            </ul>
            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!)}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition-all shadow-md shadow-accent-600/20 disabled:opacity-50"
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ? 'Loading...' : 'Subscribe yearly'}
            </button>
            <p className="text-center text-xs text-accent-600 dark:text-accent-400 mt-4 font-medium">
              Launch offer: code <span className="font-bold bg-accent-100 dark:bg-accent-900/50 px-1.5 py-0.5 rounded text-accent-800 dark:text-accent-200">LAUNCH50</span> at checkout for 50% off your first year
            </p>
          </div>
        </div>
      )}
      
      {(isActive || company.subscriptionStatus === 'past_due') && company.subscriptionStatus !== 'lifetime' && company.stripeCustomerId && (
        <div className="mt-8">
           <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 py-3 px-6 bg-ink-100 dark:bg-ink-800 hover:bg-ink-200 dark:hover:bg-ink-700 text-ink-900 dark:text-ink-50 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              <CreditCard size={18} />
              {portalLoading ? 'Opening…' : 'Manage billing'}
            </button>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">Update your card, download invoices, switch between monthly and yearly, or cancel. Add or remove users in Settings → Team management.</p>
        </div>
      )}
    </div>
  );
}

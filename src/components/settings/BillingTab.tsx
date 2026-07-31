"use client";
import React, { useState } from 'react';
import { Company } from '@/lib/firebase/schema';
import { CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';

export function BillingTab({ company }: { company: Company }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, companyId: company.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to initiate checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating checkout");
    }
    setLoading(null);
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your billing cycle and payment methods.</p>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-4 ${
        isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' :
        isTrial && daysLeft > 0 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
        'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
      }`}>
        {isActive ? (
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
        ) : isTrial && daysLeft > 0 ? (
          <AlertCircle className="text-blue-600 dark:text-blue-400 mt-0.5" />
        ) : (
          <AlertCircle className="text-rose-600 dark:text-rose-400 mt-0.5" />
        )}
        
        <div>
          <h3 className={`font-bold ${
            isActive ? 'text-emerald-900 dark:text-emerald-100' :
            isTrial && daysLeft > 0 ? 'text-blue-900 dark:text-blue-100' :
            'text-rose-900 dark:text-rose-100'
          }`}>
            {isActive ? (company.subscriptionStatus === 'lifetime' ? 'Lifetime Access' : 'Active Subscription') : 
             isTrial && daysLeft > 0 ? `Trial Active (${daysLeft} days left)` : 
             'Subscription Required'}
          </h3>
          <p className={`text-sm mt-1 ${
            isActive ? 'text-emerald-700 dark:text-emerald-300' :
            isTrial && daysLeft > 0 ? 'text-blue-700 dark:text-blue-300' :
            'text-rose-700 dark:text-rose-300'
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
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Plan</h3>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$10</span>
              <span className="text-slate-500 font-medium">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500"/> Unlimited Projects</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500"/> Team Collaboration (Up to 10)</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500"/> Full Export/Import</li>
            </ul>
            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!)}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ? 'Loading...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Yearly */}
          <div className="border-2 border-blue-600 rounded-2xl p-6 relative bg-blue-50/50 dark:bg-blue-900/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-full">
              SAVE 50%
            </div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Yearly Plan</h3>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$49.90</span>
              <span className="text-slate-500 font-medium">/year</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500"/> All Monthly Features</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500"/> Priority Support</li>
              <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-emerald-500"/> 2 Months Free equivalent</li>
            </ul>
            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!)}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ? 'Loading...' : 'Subscribe Yearly'}
            </button>
          </div>
        </div>
      )}
      
      {isActive && company.subscriptionStatus !== 'lifetime' && (
        <div className="mt-8">
           <button
              className="flex items-center gap-2 py-3 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all"
            >
              <CreditCard size={18} />
              Manage Billing in Stripe
            </button>
        </div>
      )}
    </div>
  );
}

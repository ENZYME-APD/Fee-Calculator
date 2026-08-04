import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, CheckCircle2, FileSpreadsheet, FolderKanban, Users, Share2, BarChart3, Database } from 'lucide-react';
import { AuthRedirect } from '@/components/marketing/AuthRedirect';

export default function LandingPage() {
  return (
    <div className="flex flex-col pt-20">
      <AuthRedirect />
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-32 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm font-bold mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Fee Calculator v2 is live
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
            Architectural Fees,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Calculated Intelligently.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The smartest way for modern architectural practices to estimate costs, build complex fee proposals, and manage team allocation seamlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?signup=true" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg"
            >
              Start 7-Day Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link 
              href="#pricing" 
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-2xl transition-all shadow-sm text-lg text-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to run profitable projects</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Built by architects, for architects. Stop guessing your fees and start calculating them with precision.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Calculator size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Precision Costing</h3>
              <p className="text-slate-500 dark:text-slate-400">Calculate exactly how much a project will cost based on your team's real hourly rates and overheads.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
                <FolderKanban size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Phase Management</h3>
              <p className="text-slate-500 dark:text-slate-400">Break down your projects into RIBA or custom phases, allocate hours, and track progress effortlessly.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Users size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Team Allocation</h3>
              <p className="text-slate-500 dark:text-slate-400">Assign roles to team members and ensure you always have the right mix of seniors and juniors on the job.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Share2 size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Collaborative</h3>
              <p className="text-slate-500 dark:text-slate-400">Team can work together on fees and pipeline in real-time. Share proposals effortlessly.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Business Intelligence</h3>
              <p className="text-slate-500 dark:text-slate-400">Complete dashboard to view pipeline and understand the overall health of your business.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Database size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Centralised Database</h3>
              <p className="text-slate-500 dark:text-slate-400">Store all your templates, categories, and historical project data in one secure location.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">How it works</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Get up and running in minutes, not days.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-blue-100 dark:bg-blue-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">1</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Set Up Your Team</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add your team members manually or upload them from a CSV. Set their internal costs and external billing rates.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-blue-100 dark:bg-blue-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">2</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create a Project</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Use preset templates for standard architectural phases (like RIBA) or start from scratch. Everything is fully editable.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-blue-100 dark:bg-blue-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">3</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Allocate Hours</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Drag and drop team members into your project phases to allocate hours and calculate costs interactively.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">4</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Review Proposal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review your automated fee proposal, edit payment schedules, and export your accurate calculation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-4">Choose the plan that best fits your practice.</p>
            
            {/* Early Adopter Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm font-bold shadow-sm">
              ✨ Use code <span className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">FIRST50</span> for 50% Off! (First 50 users) ✨
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Monthly Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Monthly</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Perfect for small practices starting out.</p>
              
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">$9.99</span>
                  <span className="text-slate-500 font-medium pb-1">/month</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">Only $4.99/mo with code FIRST50</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Unlimited Projects',
                  'Unlimited Team Members',
                  'Custom Hourly Rates',
                  'Export to CSV & PDF',
                  'Email Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={20} className="text-blue-600 dark:text-blue-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/login?signup=true" className="w-full py-4 rounded-xl font-bold text-center border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Yearly Plan (Popular) */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl border border-blue-600 p-8 flex flex-col shadow-xl relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Yearly</h3>
              <p className="text-slate-400 mb-6">Best value for established practices.</p>
              
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-white">$49.90</span>
                  <span className="text-slate-400 font-medium pb-1">/year</span>
                </div>
                <p className="text-sm text-emerald-400 font-bold">Only $24.95/yr with code FIRST50</p>
                <p className="text-xs text-slate-400 mt-1">That's just $2.08 per month!</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in Monthly',
                  '2 Months Free',
                  'Priority Support',
                  'Early Access to Features',
                  '1-on-1 Onboarding Call'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 size={20} className="text-blue-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/login?signup=true" className="w-full py-4 rounded-xl font-bold text-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                Start Free Trial
              </Link>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}

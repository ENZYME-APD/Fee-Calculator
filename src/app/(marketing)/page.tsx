import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, Building, CheckCircle2, FileSpreadsheet, FolderKanban, Users, Share2, BarChart3, Database } from 'lucide-react';
import { AuthRedirect } from '@/components/marketing/AuthRedirect';

export default function LandingPage() {
  return (
    <div className="flex flex-col pt-20">
      <AuthRedirect />
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-24 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden min-h-[85vh] flex items-center">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/20 dark:bg-accent-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-400 text-sm font-bold mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-600"></span>
            </span>
            Fee Calculator v2 is live
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight mb-8 leading-tight">
            Architectural Fees,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-600 dark:from-accent-400 dark:to-accent-400">
              Calculated Intelligently.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-ink-600 dark:text-ink-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The smartest way for modern architectural practices to estimate costs, build complex fee proposals, and manage team allocation seamlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?signup=true" 
              className="px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-accent-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              Start 7-Day Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="#pricing" 
              className="px-6 py-2.5 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 font-semibold rounded-xl transition-all text-sm flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-ink-50 dark:bg-ink-900/50 border-t border-ink-200 dark:border-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">Everything you need to run profitable projects</h2>
            <p className="text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">Built by architects, for architects. Stop guessing your fees and start calculating them with precision.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Calculator size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Precision Costing</h3>
              <p className="text-ink-500 dark:text-ink-400">Calculate exactly how much a project will cost based on your team's real hourly rates and overheads.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mb-6">
                <FolderKanban size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Phase Management</h3>
              <p className="text-ink-500 dark:text-ink-400">Break down your projects into RIBA or custom phases, allocate hours, and track progress effortlessly.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-positive-100 dark:bg-positive-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Users size={24} className="text-positive-600 dark:text-positive-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Team Allocation</h3>
              <p className="text-ink-500 dark:text-ink-400">Assign roles to team members and ensure you always have the right mix of seniors and juniors on the job.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-negative-100 dark:bg-negative-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Share2 size={24} className="text-negative-600 dark:text-negative-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Collaborative</h3>
              <p className="text-ink-500 dark:text-ink-400">Team can work together on fees and pipeline in real-time. Share proposals effortlessly.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-info-100 dark:bg-info-900/30 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={24} className="text-info-600 dark:text-info-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Business Intelligence</h3>
              <p className="text-ink-500 dark:text-ink-400">Complete dashboard to view pipeline and understand the overall health of your business.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-warning-100 dark:bg-warning-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Database size={24} className="text-warning-600 dark:text-warning-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Centralised Database</h3>
              <p className="text-ink-500 dark:text-ink-400">Store all your templates, categories, and historical project data in one secure location.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Walkthrough */}
      <section className="relative bg-white dark:bg-ink-950 border-t border-ink-200 dark:border-ink-800/50 py-20 sm:py-28">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24">
        {[
          {
            img: '/screenshots/team-resources.jpg?v=20261016',
            alt: 'Team Resources screen listing team members grouped by category with salary, overheads, and derived cost per hour',
            title: 'Your team, priced accurately',
            body: "Set each person's salary and overheads once — internal staff or external consultants — and the app derives their true hourly cost automatically. No more guessing what an hour of someone's time actually costs you.",
          },
          {
            img: '/screenshots/overheads.jpg?v=20261016',
            alt: 'Overheads Calculator showing target income, overhead categories, and the resulting cost multiplier',
            title: 'Overheads built into every rate',
            body: 'Model rent, software, insurance, and non-billable time by category, and sync the result straight into your team’s hourly rates. Change one overhead line and every project’s cost updates with it.',
          },
          {
            img: '/screenshots/projects-phases.jpg?v=20261016',
            alt: 'Projects and Phases screen showing a project’s phases, live total cost and fee, and payment schedule',
            title: 'Phases, costs & payment schedules in one place',
            body: 'Break a project into phases, and watch total cost, profit margin, and fee recalculate live as you work. Build the payment schedule from a preset — by phase, monthly, or weighted to each phase’s actual cost — or do it by hand.',
          },
          {
            img: '/screenshots/fee-proposal.jpg?v=20261016',
            alt: 'Fee Proposal canvas with team members and cost chips dragged into project phases, showing cost breakdowns',
            title: 'Drag, drop, and the fee calculates itself',
            body: 'Drag team members and expenses straight into project phases. Every allocation locks in that rate at the moment you assign it, so a salary change later never retroactively changes a fee you already sent a client.',
          },
        ].map((item, i) => (
          <div key={item.title} className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
            <div className="md:w-1/2 w-full">
              <img
                src={item.img}
                alt={item.alt}
                className="w-full h-auto rounded-2xl border border-ink-200 dark:border-ink-800 shadow-xl"
              />
            </div>
            <div className="md:w-1/2 w-full">
              <h3 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">{item.title}</h3>
              <p className="text-ink-500 dark:text-ink-400 text-lg leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">How it works</h2>
            <p className="text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">Get up and running in minutes, not days.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-accent-100 dark:bg-accent-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">1</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Set Up Your Team</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Add your team members manually or upload them from a CSV. Set their internal costs and external billing rates.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-accent-100 dark:bg-accent-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">2</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Create a Project</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Use preset templates for standard architectural phases (like RIBA) or start from scratch. Everything is fully editable.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-accent-100 dark:bg-accent-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">3</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Allocate Hours</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Drag and drop team members into your project phases to allocate hours and calculate costs interactively.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">4</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Review Proposal</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Review your automated fee proposal, edit payment schedules, and export your accurate calculation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">Simple, transparent pricing</h2>
            <p className="text-ink-500 dark:text-ink-400 max-w-2xl mx-auto mb-4">Choose the plan that best fits your practice.</p>
            
            {/* Early Adopter Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning-100 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-400 text-sm font-bold shadow-sm">
              ✨ Use code <span className="bg-warning-200 dark:bg-warning-800 px-1.5 py-0.5 rounded text-warning-900 dark:text-warning-200">FIRST50</span> for 50% Off! (First 50 users) ✨
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Monthly Plan */}
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ink-200 dark:border-ink-800 p-8 flex flex-col shadow-sm">
              <h3 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-2">Monthly</h3>
              <p className="text-ink-500 dark:text-ink-400 mb-6">Perfect for small practices starting out.</p>
              
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-ink-900 dark:text-ink-50">$9.99</span>
                  <span className="text-ink-500 font-medium pb-1">/month</span>
                </div>
                <p className="text-sm text-positive-600 dark:text-positive-400 font-bold">Only $4.99/mo with code FIRST50</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Unlimited Projects',
                  'Unlimited Team Members',
                  'Custom Hourly Rates',
                  'Export to CSV & PDF',
                  'Email Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink-600 dark:text-ink-300">
                    <CheckCircle2 size={20} className="text-accent-600 dark:text-accent-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/login?signup=true" className="w-full py-4 rounded-xl font-bold text-center border-2 border-accent-600 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Yearly Plan (Popular) */}
            <div className="bg-ink-900 dark:bg-ink-800 rounded-3xl border border-accent-600 p-8 flex flex-col shadow-xl relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                Most popular
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Yearly</h3>
              <p className="text-ink-500 mb-6">Best value for established practices.</p>
              
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-white">$49.90</span>
                  <span className="text-ink-500 font-medium pb-1">/year</span>
                </div>
                <p className="text-sm text-positive-400 font-bold">Only $24.95/yr with code FIRST50</p>
                <p className="text-xs text-ink-500 mt-1">That's just $2.08 per month!</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in Monthly',
                  '2 Months Free',
                  'Priority Support',
                  'Early Access to Features',
                  '1-on-1 Onboarding Call'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink-300">
                    <CheckCircle2 size={20} className="text-accent-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/login?signup=true" className="w-full py-4 rounded-xl font-bold text-center bg-accent-600 hover:bg-accent-700 text-white shadow-lg shadow-accent-600/20 transition-all hover:-translate-y-0.5">
                Start Free Trial
              </Link>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}

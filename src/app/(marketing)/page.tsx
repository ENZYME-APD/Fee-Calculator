import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, CheckCircle2, FolderKanban, Users, Share2, BarChart3, TrendingUp, Bot, Sparkles, ShieldCheck, Undo2 } from 'lucide-react';
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
            Launch offer: 50% off your first 6 months
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight mb-8 leading-tight">
            Know what a project costs<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-600 dark:from-accent-400 dark:to-accent-400">
              before you quote the fee.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-ink-600 dark:text-ink-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Fee Calculator prices every proposal from your team's real hourly cost and overheads, then carries it through phases, payment schedules and a month-by-month cash-flow forecast. And your AI assistant can work with all of it.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?signup=true" 
              className="px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-accent-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              Start your free trial
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="#pricing" 
              className="px-6 py-2.5 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 font-semibold rounded-xl transition-all text-sm flex items-center justify-center"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-500 dark:text-ink-400">7 days free · No card needed · Cancel anytime</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-ink-50 dark:bg-ink-900/50 border-t border-ink-200 dark:border-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">Everything you need to run profitable projects</h2>
            <p className="text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">Built by architects, for architects, and used on our own projects at Enzyme APD. Stop guessing fees and start pricing them from the numbers.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Calculator size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Fees from real costs</h3>
              <p className="text-ink-500 dark:text-ink-400">Every hour is priced at what it really costs you, salary plus overheads, so the margin you quote is the margin you make.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mb-6">
                <FolderKanban size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Phase planning</h3>
              <p className="text-ink-500 dark:text-ink-400">Break projects into RIBA or your own phases, plan them on a timeline and see the cost and fee of each one.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-positive-100 dark:bg-positive-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Users size={24} className="text-positive-600 dark:text-positive-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Team allocation</h3>
              <p className="text-ink-500 dark:text-ink-400">Drag people into phases and test the mix of senior and junior time until the fee and the workload both work.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-clay-100 dark:bg-clay-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Share2 size={24} className="text-clay-600 dark:text-clay-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Shared with your partners</h3>
              <p className="text-ink-500 dark:text-ink-400">Your team works on the same projects, rates and templates: 5 users included, viewers free. Salaries and overheads stay visible to admins only.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-info-100 dark:bg-info-900/30 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={24} className="text-info-600 dark:text-info-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Pipeline dashboard</h3>
              <p className="text-ink-500 dark:text-ink-400">See every proposal, its stage and its value in one place, and how much work you have secured for the year.</p>
            </div>
            
            <div className="bg-white dark:bg-ink-900 p-8 rounded-3xl border border-ink-200 dark:border-ink-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-warning-100 dark:bg-warning-900/30 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp size={24} className="text-warning-600 dark:text-warning-400" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-3">Cash-flow forecast</h3>
              <p className="text-ink-500 dark:text-ink-400">Invoices, likely work and collections month by month against your fixed overheads, so you can see your bank balance months ahead.</p>
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


      {/* Cash-flow forecast spotlight */}
      <section id="forecast" className="py-20 sm:py-28 bg-ink-50 dark:bg-ink-900/50 border-t border-ink-200 dark:border-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 dark:text-accent-400 mb-4">
              <TrendingUp size={16} /> Financial forecast
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 mb-5">See your bank balance six months before it happens</h2>
            <p className="text-lg text-ink-500 dark:text-ink-400 mb-8 leading-relaxed">
              Your proposals already know what you will invoice and when. The forecast puts that next to what the practice costs to run, so you can see a tight month coming while there is still time to act.
            </p>
            <ul className="space-y-4">
              {[
                ['Built from your proposals', 'Sync your active and proposed projects: every payment milestone lands in the month its phase reaches it.'],
                ['Invoiced, likely and collected', 'Keep the invoicing schedule apart from the cash you expect, and weight likely work so the forecast stays honest.'],
                ['Running costs included', 'Salaries and overheads flow in from Team resources and the Overheads calculator, with your own lines for loans, partners or one-off costs.'],
                ['Test a scenario', 'Group lines, switch a group off and see what losing a client or a slow quarter does to your closing cash.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 size={20} className="text-accent-600 dark:text-accent-500 shrink-0 mt-0.5" />
                  <span className="text-ink-600 dark:text-ink-300"><span className="font-semibold text-ink-900 dark:text-ink-100">{t}.</span> {d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Illustrative forecast (sample figures) */}
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 shadow-xl p-5 sm:p-6" aria-label="Example forecast with sample figures">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">Closing bank cash</span>
              <span className="text-xs text-ink-500 dark:text-ink-400">Sample figures</span>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end h-40 mb-3">
              {[{ m: 'Nov', v: 82 }, { m: 'Dec', v: 64 }, { m: 'Jan', v: 41 }, { m: 'Feb', v: 28 }, { m: 'Mar', v: 55 }, { m: 'Apr', v: 73 }].map(b => (
                <div key={b.m} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] tabular-nums text-ink-500 dark:text-ink-400">{b.v}k</span>
                  <div className={`w-full rounded-t-md ${b.v < 35 ? 'bg-warning-400 dark:bg-warning-500' : 'bg-accent-500 dark:bg-accent-500'}`} style={{ height: `${b.v}%` }} />
                  <span className="text-xs text-ink-500 dark:text-ink-400">{b.m}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-900 px-3 py-2 text-sm text-warning-800 dark:text-warning-200">
              February drops to 28k: move the stage 2 invoice forward or chase the January collection.
            </div>
          </div>
        </div>
      </section>

      {/* AI assistants */}
      <section id="ai" className="py-20 sm:py-28 bg-white dark:bg-ink-950 border-t border-ink-200 dark:border-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          {/* Illustrative conversation (sample project and figures) */}
          <div className="order-2 lg:order-1 bg-ink-50 dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 shadow-xl p-5 sm:p-6 space-y-4" aria-label="Example conversation with an AI assistant, sample data">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent-600 text-white px-4 py-2.5 text-sm">
              Which proposals are under 20% margin, and what would Riverside Library cost with one more week of design development?
            </div>
            <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 px-4 py-3 text-sm text-ink-700 dark:text-ink-200 space-y-2">
              <p>Two proposals are under 20%: Cedar Court (18%) and Harbour Lofts (15%).</p>
              <p>An extra week of design development on Riverside Library adds 1,640 in cost. At its 30% margin the fee goes from 23,681 to 25,813.</p>
              <p className="text-ink-500 dark:text-ink-400">Shall I add the week and update the payment schedule?</p>
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent-600 text-white px-4 py-2.5 text-sm">Yes, go ahead.</div>
            <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 px-4 py-3 text-sm text-ink-700 dark:text-ink-200 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-positive-600 dark:text-positive-400 shrink-0 mt-0.5" />
              <span>Done. Design development is now 5 weeks and the fee is 25,813. You can undo this in Settings → AI access.</span>
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 text-center">Sample conversation with made-up figures</p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 dark:text-accent-400 mb-4">
              <Sparkles size={16} /> Works with your AI
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 mb-5">Ask Claude or ChatGPT about your practice</h2>
            <p className="text-lg text-ink-500 dark:text-ink-400 mb-8 leading-relaxed">
              Connect the assistant you already use and it can read your proposals, phases, team and forecast, answer questions in plain language, and, if you allow it, draft and update proposals for you.
            </p>
            <ul className="space-y-4">
              {[
                [Bot, 'Connect in a minute', 'Add one address in Claude, ChatGPT, Cursor or any MCP assistant and sign in with your Fee Calculator account.'],
                [ShieldCheck, 'It sees what you can see', 'Salaries, rates and the forecast stay with admins. Admins decide who may connect and who may let it make changes.'],
                [Undo2, 'Every change can be undone', 'The assistant asks before it changes anything, and each change is logged with a one-click undo.'],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Bot;
                return (
                  <li key={t as string} className="flex gap-3">
                    <div className="h-9 w-9 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                      <I size={18} className="text-accent-600 dark:text-accent-400" />
                    </div>
                    <span className="text-ink-600 dark:text-ink-300"><span className="font-semibold text-ink-900 dark:text-ink-100 block">{t as string}</span>{d as string}</span>
                  </li>
                );
              })}
            </ul>
          </div>
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
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Set up your team</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Add people by hand or from a CSV with their salary and overheads. Their true hourly cost is worked out for you.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-accent-100 dark:bg-accent-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">2</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Create a project</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Use preset templates for standard architectural phases (like RIBA) or start from scratch. Everything is fully editable.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-accent-100 dark:bg-accent-900/50" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">3</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Allocate hours</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Drag and drop team members into your project phases to allocate hours and calculate costs interactively.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-accent-600/20">4</div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Send the proposal</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Set the payment schedule, export the proposal to Word or Excel, and follow the cash in the forecast.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">One price for your whole practice</h2>
            <p className="text-ink-500 dark:text-ink-400 max-w-2xl mx-auto mb-4">One subscription covers your company with 5 users included, and viewers are always free. Every feature is in both plans; yearly simply costs less.</p>
            
            {/* Launch offer */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 rounded-full bg-warning-100 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-400 text-sm font-bold shadow-sm">
              Launch offer: code <span className="bg-warning-200 dark:bg-warning-800 px-1.5 py-0.5 rounded text-warning-900 dark:text-warning-200">LAUNCH50</span> gives 50% off your first 6 months
              <span className="font-medium">· ends 30 April 2027</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Monthly Plan */}
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-ink-200 dark:border-ink-800 p-8 flex flex-col shadow-sm">
              <h3 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-2">Monthly</h3>
              <p className="text-ink-500 dark:text-ink-400 mb-6">Pay as you go and cancel anytime.</p>
              
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-ink-900 dark:text-ink-50">$9.99</span>
                  <span className="text-ink-500 font-medium pb-1">/month</span>
                </div>
                <p className="text-sm text-positive-600 dark:text-positive-400 font-bold">$4.99/month for your first 6 months with LAUNCH50</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Unlimited projects and proposals',
                  'Fees priced from real salaries and overheads',
                  'Phase planning with live cost and fee',
                  'Payment schedules and cash-flow forecast',
                  'AI access from Claude, ChatGPT and other assistants',
                  'Proposals exported to Word and Excel',
                  '5 users included, viewers free',
                  'Extra users $1.99 a month each',
                  'Email support'
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
                Best value
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Yearly</h3>
              <p className="text-ink-500 mb-6">Best value for established practices.</p>
              
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-white">$69</span>
                  <span className="text-ink-500 font-medium pb-1">/year</span>
                </div>
                <p className="text-sm text-positive-400 font-bold">$34.50 for your first year with LAUNCH50</p>
                <p className="text-xs text-ink-500 mt-1">$5.75 a month, 42% less than paying monthly</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in monthly, 5 users included',
                  'Extra users $7.99 a year each',
                  'A 1-on-1 onboarding call to set up your rates',
                  'Priority support',
                  'Early access to new features'
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
          <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-10">Both plans start with a 7-day free trial. No card needed to start.</p>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="py-20 border-t border-ink-200 dark:border-ink-800/50 bg-ink-50 dark:bg-ink-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-4">Price your next proposal from the numbers</h2>
          <p className="text-ink-500 dark:text-ink-400 mb-8">Set up your team and overheads once, and every fee after that starts from what the work really costs.</p>
          <Link
            href="/login?signup=true"
            className="inline-flex px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-accent-600/20 hover:-translate-y-0.5 items-center gap-2 text-sm"
          >
            Start your free trial
            <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">50% off your first 6 months with LAUNCH50</p>
        </div>
      </section>
    </div>
  );
}

const fs = require('fs');
const file = 'src/app/(marketing)/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix hero buttons: remove the stray card and make buttons smaller and elegant.
const oldHeroButtons = `<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Building size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Overhead Automation</h3>
              <p className="text-slate-500 dark:text-slate-400">Stop guessing your running costs. Our built-in Overheads Calculator tracks software, rent, and non-billable time, and automatically syncs it to your team's hourly rates.</p>
            </div>
          </div>`;

const newHeroButtons = `<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?signup=true" 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              Start 7-Day Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="#pricing" 
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-xl transition-all text-sm flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>`;

code = code.replace(oldHeroButtons, newHeroButtons);

// 2. Fix the grid to be grid-cols-3 instead of grid-cols-4
const oldGrid = `<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">`;
const newGrid = `<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">`;
code = code.replace(oldGrid, newGrid);

fs.writeFileSync(file, code);

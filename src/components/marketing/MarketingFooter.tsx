import React from 'react';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <img src="/logo-dark.png" alt="Enzyme APD" className="h-10 w-auto dark:hidden" />
              <img src="/logo-light.png" alt="Enzyme APD" className="h-10 w-auto hidden dark:block" />
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700"></div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Fee Calculator</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              Developed by Enzyme APD. A tool built by architects, for architects to calculate, propose, and manage professional fees.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Features</Link></li>
              <li><Link href="/#pricing" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Pricing</Link></li>
              <li><Link href="/wiki" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Enzyme APD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

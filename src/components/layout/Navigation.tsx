"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Calculator, Users, FolderKanban, Moon, Sun, LogOut, Settings, BookOpen, LayoutTemplate, CreditCard, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { auth, db } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, dbUser } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [isLifetime, setIsLifetime] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (dbUser?.companyId) {
      getDoc(doc(db, 'companies', dbUser.companyId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.subscriptionStatus === 'lifetime') {
            setIsLifetime(true);
          }
          setCompanyName(data.name);
        }
      });
    }
  }, [dbUser?.companyId]);
  
  if (pathname === '/login') return null;

  const navItems = [
    { name: 'Overview Dashboard', href: '/overview', icon: PieChart },
    { name: 'Projects & Phases', href: '/projects', icon: FolderKanban },
    { name: 'Fee Proposal', href: '/dashboard', icon: Calculator },
    { name: 'Team Resources', href: '/team', icon: Users },
    { name: 'Templates', href: '/templates', icon: LayoutTemplate },
    { name: 'Documentation', href: '/docs', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];
  
  return (
    <div className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 z-50 transition-colors duration-300">
      <div className="p-6 pb-2">
        <img src="/logo-light.png" alt="Enzyme APD" className="h-10 w-auto mb-1" />
        <h1 className="text-sm font-black tracking-widest text-slate-200 uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Fee Calculator</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              id={`tour-${item.href.replace('/', '')}-tab`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800 space-y-2">
        {user && (
          <div className="px-4 py-2 mb-2">
            {companyName && <p className="text-sm font-bold text-slate-200 truncate mb-0.5">{companyName}</p>}
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {dbUser && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{dbUser.role}</p>}
              {isLifetime && <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-400/30 tracking-widest shadow-sm">UNLIMITED</span>}
            </div>
          </div>
        )}
        
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all font-medium text-sm hover:bg-slate-800 hover:text-white"
        >
          {mounted && theme === 'dark' ? (
            <>
              <Sun size={18} className="text-yellow-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} className="text-slate-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {user && (
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all font-medium text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}

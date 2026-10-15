"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Calculator, Users, Building, FolderKanban, Moon, Sun, LogOut, Settings, BookOpen, LayoutTemplate, CreditCard, PieChart, ShieldAlert, CalendarDays, FileText, TrendingUp } from 'lucide-react';
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

  const isSuperadmin = user?.email?.toLowerCase().endsWith('@weareenzyme.com');
  const isAdmin = dbUser?.role === 'admin' || isSuperadmin;

  const navItems = [
    { name: 'Overview dashboard', href: '/overview', icon: PieChart },
    { name: 'Projects & phases', href: '/projects', icon: FolderKanban },
    { name: 'Fee proposal', href: '/dashboard', icon: Calculator },
    { name: 'Project planning', href: '/planning', icon: CalendarDays },
    { name: 'Document builder', href: '/documents', icon: FileText },
    // Team Resources / Overheads / Forecast expose salaries and overhead costs, so only
    // admins (or superadmins) see these in the nav at all.
    ...(isAdmin ? [
      { name: 'Team resources', href: '/team', icon: Users },
      { name: 'Overheads calculator', href: '/overheads', icon: Building },
      { name: 'Financial forecast', href: '/forecast', icon: TrendingUp },
    ] : []),
    { name: 'Templates', href: '/templates', icon: LayoutTemplate },
    { name: 'Documentation', href: '/docs', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];

  return (
    <div className="w-64 bg-ink-900 dark:bg-ink-950 text-ink-300 flex flex-col h-screen shrink-0 border-r border-ink-800 z-50 transition-colors duration-300 print:hidden">
      <div className="p-6 pb-2">
        {/* The logo PNG has ~13px of transparent padding; the negative margins line
            the wordmark up with the title and the nav icons below. */}
        <img src="/logo-light.png" alt="Enzyme APD" className="h-10 w-auto -ml-[13px] -mt-[13px] -mb-[6px]" />
        {/* Product lockup, not a UI label: tracked caps are intentional here. */}
        <h1 className="text-xs font-bold uppercase tracking-[0.22em] text-accent-300">Fee Calculator</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1.5 mt-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              id={`tour-${item.href.replace('/', '')}-tab`}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
                isActive 
                  ? "bg-accent-600 text-white shadow-md shadow-accent-900/20" 
                  : "hover:bg-ink-800 hover:text-white"
              )}
            >
              <item.icon size={18} className={isActive ? "text-white" : "text-ink-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-ink-800 space-y-2">
        {user && (
          <div className="px-3 py-1.5">
            {companyName && <p className="text-sm font-bold text-ink-200 truncate mb-0.5">{companyName}</p>}
            <p className="text-xs text-ink-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {dbUser && <p className="text-xs font-medium text-ink-400 capitalize">{dbUser.role}</p>}
              {isLifetime && <span className="bg-accent-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Unlimited</span>}
            </div>
          </div>
        )}

        {isSuperadmin && (
          <Link
            href="/superadmin"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-medium text-xs border outline-none",
              pathname === '/superadmin'
                ? "bg-warning-500/20 text-warning-300 border-warning-500/40"
                : "border-ink-800 text-ink-400 hover:text-warning-300 hover:border-warning-500/30 hover:bg-ink-800/60"
            )}
          >
            <ShieldAlert size={15} className="text-warning-400" />
            <span>Superadmin portal</span>
          </Link>
        )}
        
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all font-medium text-xs bg-ink-800/60 hover:bg-ink-800 hover:text-white border border-ink-800"
          >
            {mounted && theme === 'dark' ? (
              <>
                <Sun size={15} className="text-warning-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-ink-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          {user && (
            <button
              onClick={() => signOut(auth)}
              title="Sign out"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all font-medium text-xs text-negative-400 hover:bg-negative-500/10 hover:text-negative-300 border border-ink-800"
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

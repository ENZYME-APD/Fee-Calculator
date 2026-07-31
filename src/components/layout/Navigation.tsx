"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Calculator, Users, FolderKanban, Moon, Sun, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, dbUser } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (pathname === '/login') return null;

  const navItems = [
    { name: 'Projects & Phases', href: '/projects', icon: FolderKanban },
    { name: 'Fee Proposal', href: '/', icon: Calculator },
    { name: 'Team Resources', href: '/team', icon: Users },
    { name: 'Settings & Billing', href: '/settings', icon: Settings },
  ];
  
  return (
    <div className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 z-50 transition-colors duration-300">
      <div className="p-6 pb-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Enzyme APD</h1>
        <p className="text-xs text-slate-400 mt-1">Fee Calculator v2</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
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
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            {dbUser && <p className="text-[10px] font-bold text-blue-400 mt-0.5 uppercase tracking-wider">{dbUser.role}</p>}
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

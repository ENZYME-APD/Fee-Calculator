"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Calculator, Users, FolderKanban, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Fee Calculator', href: '/', icon: Calculator },
    { name: 'Team Resources', href: '/team', icon: Users },
    { name: 'Projects & Phases', href: '/projects', icon: FolderKanban },
  ];

  const { theme, setTheme } = useTheme();
  
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
      
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all font-medium text-sm hover:bg-slate-800 hover:text-white"
        >
          {theme === 'dark' ? (
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
      </div>
    </div>
  );
}

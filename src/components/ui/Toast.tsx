"use client";
import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export function GlobalToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setMessage(customEvent.detail.message);
      setIsVisible(true);
      
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => {
      window.removeEventListener('show-toast', handleShowToast);
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible || !message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <CheckCircle2 size={18} className="text-emerald-400 dark:text-emerald-600" />
        <span className="text-sm font-semibold">{message}</span>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-2 text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

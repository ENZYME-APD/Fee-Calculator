import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({ 
  isOpen, 
  title, 
  message, 
  defaultValue = '', 
  placeholder = '', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel 
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800">
            <div className="flex items-center gap-3">
              <div className="bg-accent-100 dark:bg-accent-900/30 p-2 rounded-xl text-accent-600 dark:text-accent-400">
                <MessageSquare size={24} />
              </div>
              <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">{title}</h2>
            </div>
            <button type="button" onClick={onCancel} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 bg-ink-50/50 dark:bg-ink-950/50 space-y-4">
            <p className="text-ink-600 dark:text-ink-400 font-medium leading-relaxed">
              {message}
            </p>
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl focus:ring-2 focus:ring-accent-500/20 outline-none text-ink-900 dark:text-ink-50 transition-all shadow-sm"
            />
          </div>
          
          <div className="p-6 border-t border-ink-100 dark:border-ink-800 flex justify-end gap-3 bg-white dark:bg-ink-900">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl font-bold text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-accent-600 hover:bg-accent-700 shadow-md shadow-accent-600/20 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

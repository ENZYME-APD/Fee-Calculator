import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
}

export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, secondaryAction }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="bg-negative-100 dark:bg-negative-900/30 p-2 rounded-xl text-negative-600 dark:text-negative-400">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 bg-ink-50/50 dark:bg-ink-950/50">
          <p className="text-ink-600 dark:text-ink-400 font-medium leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="p-6 border-t border-ink-100 dark:border-ink-800 flex justify-end gap-3 bg-white dark:bg-ink-900">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-bold text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            {cancelText}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-accent-600 hover:bg-accent-700 shadow-md shadow-accent-600/20 transition-colors"
            >
              {secondaryAction.text}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-negative-600 hover:bg-negative-700 shadow-md shadow-negative-600/20 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

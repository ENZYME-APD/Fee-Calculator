"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UndoAction {
  name: string;
  undo: () => Promise<void> | void;
}

interface UndoContextType {
  pushAction: (action: UndoAction) => void;
  undo: () => void;
  canUndo: boolean;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<UndoAction[]>([]);
  const MAX_HISTORY = 10;

  const pushAction = useCallback((action: UndoAction) => {
    setHistory((prev) => {
      const newHistory = [...prev, action];
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_HISTORY);
      }
      return newHistory;
    });
  }, []);

  const undo = useCallback(async () => {
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    
    try {
      await lastAction.undo();
      
      const event = new CustomEvent('show-toast', { 
        detail: { message: `Undid: ${lastAction.name}` }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error("Failed to undo action:", error);
    }
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (
          document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return; 
        }
        
        if (history.length > 0) {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, undo]);

  return (
    <UndoContext.Provider value={{ pushAction, undo, canUndo: history.length > 0 }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
}

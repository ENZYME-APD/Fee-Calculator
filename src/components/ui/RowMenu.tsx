"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { IconButton } from './Button';

export interface RowMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

// A "more actions" row menu that measures real screen space at open time
// and positions itself with `fixed` coordinates — flips upward when there
// isn't room below, and is never clipped by a scrolling list container.
// Previous menus either always opened downward (overflowing off-screen
// near the bottom of a list) or guessed via "is this one of the last two
// rows", which breaks as soon as the list scrolls.
export function RowMenu({ items, ariaLabel = 'More actions' }: { items: RowMenuItem[]; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current!.getBoundingClientRect();
    const menuHeight = items.length * 36 + 16;
    const menuWidth = 208;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
    const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
    setPos(
      openUp
        ? { bottom: window.innerHeight - rect.top + 4, left }
        : { top: rect.bottom + 4, left }
    );
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    // The menu is fixed-positioned from a snapshot of the trigger's
    // coordinates; if the list scrolls or the window resizes, that
    // snapshot goes stale, so just close rather than let it drift.
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <IconButton ref={btnRef} onClick={toggle} aria-label={ariaLabel}>
        <MoreVertical size={14} />
      </IconButton>
      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            className="fixed w-52 bg-white dark:bg-ink-800 rounded-xl shadow-lg border border-ink-200 dark:border-ink-700 py-1 z-50"
            style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                  item.danger
                    ? 'text-negative-600 dark:text-negative-400 hover:bg-negative-50 dark:hover:bg-negative-900/30'
                    : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

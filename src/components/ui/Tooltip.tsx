'use client';

import React, { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: Position;
  className?: string; // Additional classes for the wrapper
  wrapper?: 'div' | 'span';
  style?: React.CSSProperties;
}

const GAP = 8; // space between trigger and tooltip
const EDGE = 8; // minimum distance from the window edge

/**
 * Hover/focus tooltip rendered into document.body, so it always sits in front of
 * everything and is never clipped by a parent with overflow hidden/auto (cards,
 * scrolling tables, side panels). It flips to the opposite side when there's no
 * room and is kept inside the window.
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className = 'inline-flex',
  wrapper: Wrapper = 'div',
  style,
}: TooltipProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Measure after the tooltip renders (invisible), then place it.
  useLayoutEffect(() => {
    if (!open || !anchor || !tipRef.current) return;
    const r = anchor.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let place = position;
    if (place === 'top' && r.top - t.height - GAP < EDGE) place = 'bottom';
    else if (place === 'bottom' && r.bottom + t.height + GAP > vh - EDGE) place = 'top';
    else if (place === 'left' && r.left - t.width - GAP < EDGE) place = 'right';
    else if (place === 'right' && r.right + t.width + GAP > vw - EDGE) place = 'left';

    let top: number;
    let left: number;
    if (place === 'top' || place === 'bottom') {
      top = place === 'top' ? r.top - t.height - GAP : r.bottom + GAP;
      left = r.left + r.width / 2 - t.width / 2;
    } else {
      top = r.top + r.height / 2 - t.height / 2;
      left = place === 'left' ? r.left - t.width - GAP : r.right + GAP;
    }
    left = Math.min(Math.max(left, EDGE), vw - t.width - EDGE);
    top = Math.min(Math.max(top, EDGE), vh - t.height - EDGE);
    setCoords({ top, left });
  }, [open, anchor, position, content]);

  // A fixed-position tooltip would drift away from its trigger on scroll; hide it instead.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const show = () => setOpen(true);
  const hide = () => {
    setOpen(false);
    setCoords(null);
  };

  return (
    <Wrapper
      ref={setAnchor}
      className={`relative ${className}`}
      style={style}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && content != null && content !== '' && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? 'visible' : 'hidden',
            }}
            className="w-max max-w-xs z-[10000] pointer-events-none bg-ink-900/95 backdrop-blur-sm text-white text-[11px] font-medium tracking-wide rounded-lg py-1.5 px-3 shadow-xl border border-ink-700/50 whitespace-pre-wrap text-center hidden md:block"
          >
            {content}
          </div>,
          document.body
        )}
    </Wrapper>
  );
}

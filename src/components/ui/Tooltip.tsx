import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string; // Additional classes for the wrapper
  wrapper?: 'div' | 'span';
  style?: React.CSSProperties;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  className = 'inline-flex',
  wrapper: Wrapper = 'div',
  style
}: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <Wrapper className={`group/tooltip relative ${className}`} style={style}>
      {children}
      <div 
        className={`absolute ${positionClasses[position]} w-max max-w-xs z-[9999] pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-100 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] font-medium tracking-wide rounded-lg py-1.5 px-3 shadow-xl border border-slate-700/50 whitespace-pre-wrap text-center hidden md:block`}
      >
        {content}
      </div>
    </Wrapper>
  );
}

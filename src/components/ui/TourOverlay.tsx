"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '@/lib/context/TourContext';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

import { tca } from '@/lib/theme';
export function TourOverlay() {
  const { isOpen, currentStep, currentStepIndex, nextStep, prevStep, stopTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      setIsReady(false);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        setIsReady(true);
      } else {
        // If element is not found, maybe it's still rendering. Try again shortly.
        setTimeout(() => {
          const retryEl = document.querySelector(currentStep.target);
          if (retryEl) {
            setTargetRect(retryEl.getBoundingClientRect());
            setIsReady(true);
          }
        }, 500);
      }
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    // Also update on scroll just in case
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen, currentStep]);

  if (!isOpen || !currentStep || !isReady || !targetRect) return null;

  const padding = 8;
  const rx = 12; // rounded corners for the cutout

  const x = targetRect.left - padding;
  const y = targetRect.top - padding;
  const width = targetRect.width + padding * 2;
  const height = targetRect.height + padding * 2;

  // Calculate bubble position
  let bubbleStyle: React.CSSProperties = {};
  const bubbleWidth = 320;
  
  if (currentStep.placement === 'bottom') {
    bubbleStyle = {
      top: y + height + 16,
      left: Math.max(16, Math.min(x + (width / 2) - (bubbleWidth / 2), windowSize.width - bubbleWidth - 16)),
    };
  } else if (currentStep.placement === 'top') {
    bubbleStyle = {
      bottom: windowSize.height - y + 16,
      left: Math.max(16, Math.min(x + (width / 2) - (bubbleWidth / 2), windowSize.width - bubbleWidth - 16)),
    };
  } else if (currentStep.placement === 'left') {
    bubbleStyle = {
      top: Math.max(16, y + (height / 2) - 100),
      right: windowSize.width - x + 16,
    };
  } else {
    // right
    bubbleStyle = {
      top: Math.max(16, y + (height / 2) - 100),
      left: x + width + 16,
    };
  }

  // Fallback if bubble goes out of bounds horizontally (for left/right)
  if (bubbleStyle.left && (bubbleStyle.left as number) + bubbleWidth > windowSize.width) {
    bubbleStyle.left = windowSize.width - bubbleWidth - 16;
  }
  
  const isLastStep = currentStepIndex === 7;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300">
      {/* SVG Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={x} 
              y={y} 
              width={width} 
              height={height} 
              rx={rx} 
              fill="black" 
              className="transition-all duration-500 ease-in-out"
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill={tca('ink', 950, 0.7)} 
          mask="url(#tour-mask)" 
        />
        {/* Border stroke around the cutout */}
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          rx={rx} 
          fill="none"
          stroke={tca('accent', 500, 0.8)}
          strokeWidth="3"
          strokeDasharray="8 4"
          className="transition-all duration-500 ease-in-out animate-[spin_4s_linear_infinite]"
        />
      </svg>
      {/* 4 Blocker Divs to prevent clicks outside the highlighted area */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto" style={{ height: Math.max(0, y), zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto" style={{ top: y + height, bottom: 0, zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      <div className="absolute left-0 pointer-events-auto" style={{ top: Math.max(0, y), height, width: Math.max(0, x), zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      <div className="absolute right-0 pointer-events-auto" style={{ top: Math.max(0, y), height, left: x + width, right: 0, zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />


      {/* Bubble */}
      <div 
        className="absolute pointer-events-auto bg-white dark:bg-ink-800 rounded-2xl shadow-2xl border border-ink-200 dark:border-ink-700 p-5 flex flex-col gap-3 transition-all duration-500 ease-in-out"
        style={{ ...bubbleStyle, width: bubbleWidth, zIndex: 2 }}
      >
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-black text-lg text-ink-800 dark:text-ink-100">{currentStep.title}</h3>
          <button onClick={stopTour} className="text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 p-1 rounded-full bg-ink-100 dark:bg-ink-700/50 hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-sm text-ink-600 dark:text-ink-400 leading-relaxed">
          {currentStep.content}
        </p>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-ink-100 dark:border-ink-700/50">
          <div className="text-xs font-bold text-ink-500">
            {currentStepIndex + 1} / 8
          </div>
          
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button 
                onClick={prevStep}
                className="px-3 py-1.5 text-xs font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-lg transition-colors flex items-center"
              >
                <ChevronLeft size={14} className="mr-1" />
                Back
              </button>
            )}
            
            {!currentStep.waitForClick ? (
              <button 
                onClick={isLastStep ? stopTour : nextStep}
                className="px-4 py-1.5 text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors flex items-center shadow-md shadow-accent-500/20"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {isLastStep ? <Check size={14} className="ml-1.5" /> : <ChevronRight size={14} className="ml-1" />}
              </button>
            ) : (
              <div className="px-3 py-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 animate-pulse bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-100 dark:border-accent-800">
                Click highlighted area to continue
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

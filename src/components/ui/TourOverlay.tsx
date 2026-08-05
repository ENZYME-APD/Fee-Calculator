"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '@/lib/context/TourContext';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

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
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 1 }}>
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
          fill="rgba(15, 23, 42, 0.7)" 
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
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="3"
          strokeDasharray="8 4"
          className="transition-all duration-500 ease-in-out animate-[spin_4s_linear_infinite]"
        />
      </svg>

      {/* Bubble */}
      <div 
        className="absolute pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 transition-all duration-500 ease-in-out"
        style={{ ...bubbleStyle, width: bubbleWidth, zIndex: 2 }}
      >
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">{currentStep.title}</h3>
          <button onClick={stopTour} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {currentStep.content}
        </p>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div className="text-xs font-bold text-slate-400">
            {currentStepIndex + 1} / 8
          </div>
          
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button 
                onClick={prevStep}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center"
              >
                <ChevronLeft size={14} className="mr-1" />
                Back
              </button>
            )}
            
            {!currentStep.waitForClick ? (
              <button 
                onClick={isLastStep ? stopTour : nextStep}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center shadow-md shadow-blue-500/20"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {isLastStep ? <Check size={14} className="ml-1.5" /> : <ChevronRight size={14} className="ml-1" />}
              </button>
            ) : (
              <div className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 animate-pulse bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                Click highlighted area to continue
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

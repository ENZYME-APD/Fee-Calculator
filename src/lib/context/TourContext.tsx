"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  waitForClick?: boolean; // If true, the tour hides the 'Next' button and waits for the user to click the element
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: '#tour-team-tab',
    title: '1. Create Team Resources',
    content: 'Click here to head to the Team Resources tab and add your team members, their roles, and their hourly costs.',
    placement: 'bottom',
    waitForClick: true,
  },
  {
    target: '#tour-projects-tab',
    title: '2. Create a Project',
    content: 'Next, click here to go to the Projects tab to build your timeline by adding phases and setting up a baseline payment schedule.',
    placement: 'bottom',
    waitForClick: true,
  },
  {
    target: '#tour-dashboard-tab',
    title: '3. Workspace',
    content: 'Now click here to enter the Fee Proposal canvas where the magic happens!',
    placement: 'bottom',
    waitForClick: true,
  },
  {
    target: '#tour-team-sidebar',
    title: 'Assign Resources',
    content: 'This is the core workspace! Drag your team members from the left into the phase lanes to allocate their time.',
    placement: 'right',
  },
  {
    target: '#tour-title-block',
    title: 'Check the Cost & Profits',
    content: 'As you assign resources, your total internal cost is calculated instantly. Adjust your profit margin here to see your final fee.',
    placement: 'left',
  },
  {
    target: '#tour-summary-buttons',
    title: 'Summary & Payment Schedule',
    content: 'Click here to view a detailed breakdown of your margins and finalize how the client will pay you.',
    placement: 'bottom',
  },
  {
    target: '#tour-export-btn',
    title: 'Export to Excel',
    content: 'Ready to send? Export a clean, formatted Excel file to share your fee proposal with the client.',
    placement: 'bottom',
  },
  {
    target: '#tour-overview-tab',
    title: 'Global Dashboard',
    content: 'Finally, track all your active proposals, pipeline cashflow, and team utilization here on the Global Dashboard.',
    placement: 'bottom',
    waitForClick: true,
  },
];

interface TourContextType {
  isOpen: boolean;
  currentStepIndex: number;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: TourStep | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev >= TOUR_STEPS.length - 1) {
        setIsOpen(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStepIndex];
    if (step.waitForClick) {
      // Find element and wait for it
      // Using a short timeout to ensure the DOM is ready after navigation
      const timeoutId = setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          const handleClick = () => {
            nextStep();
          };
          el.addEventListener('click', handleClick);
          return () => {
            el.removeEventListener('click', handleClick);
          };
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, currentStepIndex, nextStep]);

  return (
    <TourContext.Provider value={{
      isOpen,
      currentStepIndex,
      startTour,
      stopTour,
      nextStep,
      prevStep,
      currentStep: isOpen ? TOUR_STEPS[currentStepIndex] : null,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

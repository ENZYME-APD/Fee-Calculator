import { GanttPlanner } from '@/components/planning/GanttPlanner';
import { Suspense } from 'react';

export const metadata = {
  title: 'Project Planning | Fee Calculator',
};

export default function PlanningPage() {
  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden w-full">
      <Suspense fallback={<div>Loading planner...</div>}><GanttPlanner /></Suspense>
    </div>
  );
}

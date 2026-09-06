import { GanttPlanner } from '@/components/planning/GanttPlanner';

export const metadata = {
  title: 'Project Planning | Fee Calculator',
};

export default function PlanningPage() {
  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden w-full">
      <GanttPlanner />
    </div>
  );
}

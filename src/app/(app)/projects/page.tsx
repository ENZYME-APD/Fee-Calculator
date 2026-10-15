import { Suspense } from 'react';
import { ProjectManager } from '@/components/projects/ProjectManager';

export default function ProjectsPage() {
  return (
    <div className="h-full bg-ink-50 dark:bg-ink-950 transition-colors duration-300">
      <Suspense fallback={null}><ProjectManager /></Suspense>
    </div>
  );
}

import { ProjectManager } from '@/components/projects/ProjectManager';

export default function ProjectsPage() {
  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <ProjectManager />
    </div>
  );
}

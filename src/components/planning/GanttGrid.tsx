"use client";
import React, { useState, useMemo } from 'react';
import { Project, Phase, TeamMember, ProjectTask, Allocation } from '@/lib/firebase/schema';
import { Plus } from 'lucide-react';
import { format, addDays, isWeekend, differenceInDays } from 'date-fns';

interface GanttGridProps {
  project: Project;
  phases: Phase[];
  members: TeamMember[];
  allocations: Allocation[];
  tasks: ProjectTask[];
  onTaskCreate: (task: Omit<ProjectTask, 'id' | 'companyId'>) => void;
  onTaskUpdate: (id: string, updates: Partial<ProjectTask>) => void;
}

const CELL_WIDTH = 48;

export function GanttGrid({ project, phases, members, allocations, tasks, onTaskCreate, onTaskUpdate }: GanttGridProps) {
  // Find project members (those who have an allocation)
  const projectMemberIds = Array.from(new Set(allocations.map(a => a.memberId)));
  const projectMembers = members.filter(m => projectMemberIds.includes(m.id!));

  const startDate = project.startDate ? new Date(project.startDate) : new Date();
  startDate.setHours(0,0,0,0);
  
  // Let's render a 90 day window for now
  const days = 90;
  const dates = Array.from({ length: days }).map((_, i) => addDays(startDate, i));

  // Phase mapping for colors
  const phaseColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];

  const phaseTimeline = useMemo(() => {
    let currentStart = startDate;
    return [...phases].sort((a,b) => a.order - b.order).map(phase => {
      const start = new Date(currentStart);
      const durationDays = phase.durationWeeks * 7;
      const end = addDays(start, durationDays);
      currentStart = end;
      return { ...phase, startDate: start, endDate: end, durationDays };
    });
  }, [phases, startDate]);

  
  const [draggingTask, setDraggingTask] = useState<{ id: string; startLeft: number; startWidth: number; initialMouseX: number; type: 'move' | 'resize' } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handlePointerDown = (e: React.PointerEvent, task: ProjectTask, type: 'move' | 'resize', currentLeft: number, currentWidth: number) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingTask({
      id: task.id!,
      startLeft: currentLeft,
      startWidth: currentWidth,
      initialMouseX: e.clientX,
      type
    });
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTask) return;
    const deltaX = e.clientX - draggingTask.initialMouseX;
    setDragOffset(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingTask) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Calculate new start or width based on snap (CELL_WIDTH)
    const snapDelta = Math.round(dragOffset / CELL_WIDTH);
    
    if (snapDelta !== 0) {
      if (draggingTask?.type === 'move') {
        const task = tasks.find(t => t.id === draggingTask.id);
        if (task) {
          const newStart = addDays(new Date(task.startDate), snapDelta).getTime();
          onTaskUpdate(task.id!, { startDate: newStart });
        }
      } else if (draggingTask?.type === 'resize') {
        const task = tasks.find(t => t.id === draggingTask.id);
        if (task) {
          const newDuration = Math.max(8, task.durationHours + (snapDelta * 8));
          onTaskUpdate(task.id!, { durationHours: newDuration });
        }
      }
    }
    
    setDraggingTask(null);
    setDragOffset(0);
  };

  const getPhaseColor = (phaseId: string) => {
    const idx = phases.findIndex(p => p.id === phaseId);
    return phaseColors[idx % phaseColors.length] || 'bg-slate-500';
  };

  const handleCellClick = (memberId: string, date: Date) => {
    // Quick create task
    // Try to infer phase from existing tasks on this date? Or just assign to first phase.
    if (phases.length === 0) return;
    
    onTaskCreate({
      projectId: project.id!,
      phaseId: phases[0].id!,
      memberId,
      name: 'New Task',
      description: '',
      startDate: date.getTime(),
      durationHours: 8,
      includeWeekends: false
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* Fixed Left Column for Members + Scrollable Right Grid */}
      <div className="flex h-full overflow-hidden">
        
        {/* Left Column (Members) */}
        <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50 z-10">
          <div className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0 bg-slate-100 dark:bg-slate-900">
            <span className="font-bold text-sm text-slate-500 uppercase">Team Members</span>
          </div>
          <div className="flex-1 overflow-y-auto hidden-scrollbar">
            {projectMembers.map(member => (
              <div key={member.id} className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 bg-white dark:bg-slate-950">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm truncate">{member.name}</span>
                  <span className="text-xs text-slate-500 truncate">{member.role || member.position}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area (Grid) */}
        <div className="flex-1 overflow-auto relative hidden-scrollbar" style={{ cursor: draggingTask ? (draggingTask?.type === 'move' ? 'grabbing' : 'col-resize') : 'default' }} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          
          {/* Header Row (Dates) */}
          <div className="flex h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-20 w-max">
            {dates.map((date, i) => (
              <div 
                key={i} 
                className={`w-[48px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-xs ${isWeekend(date) ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}
              >
                <span className="font-medium opacity-50">{format(date, 'EE')}</span>
                <span className="font-bold">{format(date, 'd')}</span>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="w-max relative">
            {projectMembers.map(member => (
              <div key={member.id} className="flex h-16 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group relative">
                {/* Background Cells */}
                {dates.map((date, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleCellClick(member.id!, date)}
                    className={`w-[48px] shrink-0 border-r border-slate-100 dark:border-slate-800/50 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all ${isWeekend(date) ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''}`}
                  >
                    <Plus size={14} className="text-blue-400" />
                  </div>
                ))}

                {/* Render Tasks for this member */}
                {tasks.filter(t => t.memberId === member.id).map(task => {
                  const taskStart = new Date(task.startDate);
                  taskStart.setHours(0,0,0,0);
                  
                  // Calculate days offset
                  const offsetDays = differenceInDays(taskStart, startDate);
                  
                  // Skip if outside view
                  if (offsetDays < 0 || offsetDays >= days) return null;
                  
                  // Calculate width (assume 8 hours = 1 day)
                  // If includeWeekends is false, duration spans skipping weekends, but for UI simplicity in V1 we just make width = durationHours/8.
                  const durationDays = Math.max(1, task.durationHours / 8);
                  
                  const left = offsetDays * CELL_WIDTH;
                  const width = durationDays * CELL_WIDTH;
                  const isDot = task.durationHours < 8;

                  const colorClass = getPhaseColor(task.phaseId);

                  
                  const isDraggingThis = draggingTask?.id === task.id;
                  let displayLeft = left;
                  let displayWidth = width;
                  
                  if (isDraggingThis) {
                    if (draggingTask?.type === 'move') displayLeft += dragOffset;
                    if (draggingTask?.type === 'resize') displayWidth = Math.max(CELL_WIDTH, displayWidth + dragOffset);
                  }

                  return (
                    <div 
                      key={task.id}
                      className={`absolute top-2 h-12 rounded-md shadow-sm flex items-center px-2 z-10 ${colorClass} text-white group/task select-none`}
                      style={{ 
                        left: `${displayLeft + 4}px`, 
                        width: `${displayWidth - 8}px`,
                        opacity: isDraggingThis ? 0.7 : 0.9,
                        transition: isDraggingThis ? 'none' : 'left 0.2s, width 0.2s',
                        cursor: 'grab'
                      }}
                      onPointerDown={(e) => handlePointerDown(e, task, 'move', displayLeft, displayWidth)}
                      title={task.name}
                    >
                      <span className="text-xs font-semibold truncate pointer-events-none">{task.name}</span>
                      
                      {/* Resize Handle */}
                      <div 
                        className="absolute right-0 top-0 w-4 h-full cursor-col-resize opacity-0 group-hover/task:opacity-100 flex items-center justify-center"
                        onPointerDown={(e) => handlePointerDown(e, task, 'resize', displayLeft, displayWidth)}
                      >
                        <div className="w-1 h-4 bg-white/50 rounded-full pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

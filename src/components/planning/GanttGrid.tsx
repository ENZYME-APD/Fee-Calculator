
"use client";
import React, { useState, useMemo } from 'react';
import { Project, Phase, TeamMember, ProjectTask, Allocation } from '@/lib/firebase/schema';
import { Plus, Edit2, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, addDays, isWeekend, differenceInDays } from 'date-fns';
import { EditTaskModal } from './EditTaskModal';

interface GanttGridProps {
  project: Project;
  phases: Phase[];
  members: TeamMember[];
  allocations: Allocation[];
  tasks: ProjectTask[];
  onTaskCreate: (task: Omit<ProjectTask, 'id' | 'companyId'>) => void;
  onTaskUpdate: (id: string, updates: Partial<ProjectTask>) => void;
  onTaskDelete: (id: string) => void;
  collapsedPhases: Set<string>;
  setCollapsedPhases: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const CELL_WIDTH = 48;
const COLLAPSED_WIDTH = 64;

export function GanttGrid({ project, phases, members, allocations, tasks, onTaskCreate, onTaskUpdate, onTaskDelete, collapsedPhases, setCollapsedPhases }: GanttGridProps) {
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [addedMemberIds, setAddedMemberIds] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  
  const projectMemberIds = Array.from(new Set([
    ...allocations.map(a => a.memberId),
    ...tasks.filter(t => t.memberId).map(t => t.memberId!),
    ...addedMemberIds
  ]));
  const projectMembers = members.filter(m => projectMemberIds.includes(m.id!));
  const availableMembersToAdd = members.filter(m => !projectMemberIds.includes(m.id!));

  const startDate = project.startDate ? new Date(project.startDate) : new Date();
  startDate.setHours(0,0,0,0);
  
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

  const totalDays = phaseTimeline.reduce((sum, p) => sum + p.durationDays, 0) || 90;

  const dayCoords = useMemo(() => {
    const coords = new Array(totalDays);
    let currentX = 0;
    let currentDay = 0;
    
    for (const phase of phaseTimeline) {
       const isCollapsed = collapsedPhases.has(phase.id!);
       const phaseDays = phase.durationDays;
       
       if (isCollapsed) {
          for (let i = 0; i < phaseDays; i++) {
             coords[currentDay + i] = { x: currentX, w: 0 }; 
          }
          currentX += COLLAPSED_WIDTH;
       } else {
          for (let i = 0; i < phaseDays; i++) {
             coords[currentDay + i] = { x: currentX, w: CELL_WIDTH };
             currentX += CELL_WIDTH;
          }
       }
       currentDay += phaseDays;
    }
    
    while (currentDay < totalDays) {
       coords[currentDay] = { x: currentX, w: CELL_WIDTH };
       currentX += CELL_WIDTH;
       currentDay++;
    }
    
    return coords;
  }, [phaseTimeline, collapsedPhases, totalDays]);

  const totalGridWidth = dayCoords.length > 0 ? dayCoords[dayCoords.length-1].x + dayCoords[dayCoords.length-1].w : 0;

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

  const handleAutoGenerate = () => {
    allocations.forEach(alloc => {
      if (alloc.hours <= 0) return;
      const phase = phaseTimeline.find(p => p.id === alloc.phaseId);
      if (!phase) return;
      onTaskCreate({
        projectId: project.id!,
        phaseId: alloc.phaseId,
        memberId: alloc.memberId,
        name: phase.name + ' Work',
        description: 'Auto-generated from fee proposal',
        startDate: phase.startDate.getTime(),
        durationHours: alloc.hours,
        includeWeekends: false
      });
    });
  };

  const handleCellClick = (memberId: string, date: Date) => {
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
  
  const togglePhase = (phaseId: string) => {
    setCollapsedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      {tasks.length === 0 && allocations.length > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <h4 className="font-bold">Generate Timeline?</h4>
            <p className="text-sm text-blue-100">Automatically create tasks from budgeted hours.</p>
          </div>
          <button 
            onClick={handleAutoGenerate}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Auto-Generate
          </button>
        </div>
      )}

      <div 
        className="flex-1 overflow-auto relative hidden-scrollbar" 
        style={{ cursor: draggingTask ? (draggingTask.type === 'move' ? 'grabbing' : 'col-resize') : 'default' }} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp}
      >
        <div className="flex flex-col" style={{ width: totalGridWidth + 256 }}>
          
          {/* Header Row */}
          <div className="sticky top-0 z-40 flex shadow-sm">
            {/* Top-Left Corner (Sticky) */}
            <div className="w-64 shrink-0 sticky left-0 z-50 bg-slate-100 dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 h-20 flex items-center px-4 box-border">
              <span className="font-bold text-sm text-slate-500 uppercase">Team Members</span>
            </div>
            
            {/* Timeline Headers */}
            <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-20 box-border relative" style={{ width: totalGridWidth }}>
              
              {/* Phase Track (h-8) */}
              <div className="flex h-8 border-b border-slate-100 dark:border-slate-800/50 absolute top-0 left-0 w-full box-border overflow-hidden">
                {phaseTimeline.map(pt => {
                  const startDay = differenceInDays(pt.startDate, startDate);
                  if (startDay < 0 || startDay >= totalDays) return null;
                  
                  const x = dayCoords[startDay].x;
                  const isCollapsed = collapsedPhases.has(pt.id!);
                  const width = isCollapsed ? COLLAPSED_WIDTH : pt.durationDays * CELL_WIDTH;

                  return (
                    <div 
                      key={pt.id} 
                      onClick={() => togglePhase(pt.id!)}
                      className={`absolute top-1 h-6 rounded-md px-2 flex items-center shadow-sm text-white text-xs font-bold ${getPhaseColor(pt.id!)} cursor-pointer hover:opacity-100 transition-opacity flex justify-between z-10`}
                      style={{ left: x + 2, width: Math.max(0, width - 4), opacity: 0.8 }}
                    >
                       {!isCollapsed && <span className="truncate">{pt.name}</span>}
                       {isCollapsed ? <ChevronRight size={14} className="mx-auto" /> : <ChevronLeft size={14} />}
                    </div>
                  )
                })}
              </div>
              
              {/* Dates Row (h-12) */}
              <div className="flex h-12 absolute top-8 left-0 w-full box-border">
                {phaseTimeline.map(pt => {
                  const startDay = differenceInDays(pt.startDate, startDate);
                  const isCollapsed = collapsedPhases.has(pt.id!);
                  
                  if (isCollapsed) {
                    const x = dayCoords[startDay].x;
                    return (
                      <div key={`col-${pt.id}`} className="absolute h-full border-r border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50" style={{ left: x, width: COLLAPSED_WIDTH }}>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '100%' }}>{pt.name}</span>
                      </div>
                    )
                  } else {
                    return Array.from({ length: pt.durationDays }).map((_, i) => {
                      const dayIdx = startDay + i;
                      if (dayIdx >= totalDays) return null;
                      const date = addDays(startDate, dayIdx);
                      const x = dayCoords[dayIdx].x;
                      return (
                        <div key={`d-${dayIdx}`} className={`absolute h-full border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] box-border ${isWeekend(date) ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400' : 'text-slate-700 dark:text-slate-300'}`} style={{ left: x, width: CELL_WIDTH }}>
                          <span className="font-medium opacity-50 uppercase tracking-wider">{format(date, 'EE')}</span>
                          <span className="font-bold text-xs">{format(date, 'd')}</span>
                        </div>
                      )
                    });
                  }
                })}
              </div>
            </div>
          </div>

          {/* Grid Body */}
          {projectMembers.map(member => (
            <div key={member.id} className="flex h-16 border-b border-slate-100 dark:border-slate-800/50 group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors box-border relative">
              
              {/* Left Column Member (Sticky) */}
              <div className="w-64 shrink-0 sticky left-0 z-30 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-900 transition-colors box-border shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm truncate">{member.name}</span>
                  <span className="text-xs text-slate-500 truncate">{member.role || member.position}</span>
                </div>
              </div>

              {/* Grid Cells Container */}
              <div className="absolute left-64 top-0 h-full box-border" style={{ width: totalGridWidth }}>
                {/* Background Cells */}
                {phaseTimeline.map(pt => {
                  const startDay = differenceInDays(pt.startDate, startDate);
                  const isCollapsed = collapsedPhases.has(pt.id!);
                  
                  if (isCollapsed) {
                    const x = dayCoords[startDay].x;
                    return (
                      <div key={`bg-col-${pt.id}`} className="absolute h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900" style={{ left: x, width: CELL_WIDTH }} />
                    )
                  } else {
                    return Array.from({ length: pt.durationDays }).map((_, i) => {
                      const dayIdx = startDay + i;
                      if (dayIdx >= totalDays) return null;
                      const date = addDays(startDate, dayIdx);
                      const x = dayCoords[dayIdx].x;
                      return (
                        <div 
                          key={`bg-d-${dayIdx}`} 
                          onClick={() => handleCellClick(member.id!, date)}
                          className={`absolute h-full border-r border-slate-100 dark:border-slate-800/50 cursor-pointer flex items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all box-border ${isWeekend(date) ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''}`} 
                          style={{ left: x, width: CELL_WIDTH }}
                        >
                          <Plus size={14} className="text-blue-400" />
                        </div>
                      )
                    });
                  }
                })}

                {/* Render Tasks for this member */}
                {tasks.filter(t => t.memberId === member.id).map(task => {
                  const taskStart = new Date(task.startDate);
                  taskStart.setHours(0,0,0,0);
                  
                  const offsetDays = differenceInDays(taskStart, startDate);
                  const durationDays = Math.max(1, task.durationHours / 8);

                  if (offsetDays < 0 || offsetDays >= totalDays) return null;
                  
                  let left = dayCoords[offsetDays].x;
                  let width = 0;
                  for (let i = 0; i < durationDays; i++) {
                     const d = offsetDays + i;
                     if (d < totalDays) width += dayCoords[d].w;
                  }

                  if (width === 0) return null;

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
                      className={`absolute top-2 h-12 rounded-md shadow-sm flex items-center px-2 z-20 ${colorClass} text-white group/task select-none`}
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

                      {/* Edit Button */}
                      {!isDraggingThis && (
                        <button 
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          className="w-5 h-5 ml-auto bg-black/10 rounded flex items-center justify-center opacity-0 group-hover/task:opacity-100 hover:bg-black/20 transition-all cursor-pointer shrink-0 pointer-events-auto"
                        >
                          <Edit2 size={10} className="text-white" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add Team Member Button */}
          <div className="flex h-16 border-b border-slate-100 dark:border-slate-800/50 transition-colors box-border relative">
            <div className="w-64 shrink-0 sticky left-0 z-30 bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-200 dark:border-slate-800 flex flex-col p-2 box-border justify-center shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
              {!showAddMember ? (
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus size={16} /> Add Team Member
                </button>
              ) : (
                <select 
                  className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      setAddedMemberIds(prev => [...prev, e.target.value]);
                      setShowAddMember(false);
                    }
                  }}
                  onBlur={() => setShowAddMember(false)}
                  autoFocus
                >
                  <option value="">Select a member...</option>
                  {availableMembersToAdd.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role || m.position})</option>
                  ))}
                </select>
              )}
            </div>
            {/* Fill remaining empty space for consistent layout */}
            <div className="absolute left-64 top-0 h-full" style={{ width: totalGridWidth }}></div>
          </div>
          
        </div>
      </div>
      
      {editingTask && (
        <EditTaskModal 
          task={editingTask}
          phases={phases}
          members={members}
          onClose={() => setEditingTask(null)}
          onSave={(id, updates) => {
            onTaskUpdate(id, updates);
            setEditingTask(null);
          }}
          onDelete={(id) => {
            onTaskDelete(id);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

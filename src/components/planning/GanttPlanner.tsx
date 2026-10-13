"use client";
import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';
import React, { useState, useEffect } from 'react';
import { Project, Phase, TeamMember, ProjectTask, Allocation, ProjectCost } from '@/lib/firebase/schema';
import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts, deleteProjectTask, addAllocation, updateAllocation } from '@/lib/firebase/db';
import { Folder, Eye, EyeOff, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft, RefreshCw, Undo2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GanttGrid } from './GanttGrid';
import { getAllocationRate } from '@/lib/utils/allocationCost';
import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export function GanttPlanner() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');
  const { dbCompany } = useAuth();
  const { formatCurrency } = useAppSettings();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId || null);
  const [showLost, setShowLost] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Checking Premium Tier
  // For now, let's assume 'pro' tier is required. If dbCompany.tier is not 'pro', we show upgrade.
  // Actually, we don't have dbCompany.tier fully active yet, let's just make it a mocked 'pro' for now or 'basic'
  const isPro = true; // FORCE ENABLED FOR TESTING

  useEffect(() => {
    if (initialProjectId && initialProjectId !== activeProjectId) {
      setActiveProjectId(initialProjectId);
    }
  }, [initialProjectId]);
  
  useEffect(() => {
    loadProjects();
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    const [pMembers, pAllocations] = await Promise.all([
      getTeamMembers(),
      getAllocations()
    ]);
    setMembers(pMembers);
    setAllocations(pAllocations);
  };

  const loadProjects = async () => {
    setLoading(true);
    const data = await getProjects();
    const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
    setProjects(sorted);
    if (sorted.length > 0 && !activeProjectId) {
      const initial = initialProjectId && sorted.find(p => p.id === initialProjectId)
        ? initialProjectId
        : (sorted.find(p => !p.isTemplate && p.status !== 'Lost') || sorted[0])?.id || null;
      if (initial) {
        setActiveProjectId(initial);
      }
    }
    setLoading(false);
  };

  
  useEffect(() => {
    if (activeProjectId) {
      loadProjectData(activeProjectId);
    }
  }, [activeProjectId]);

  const loadProjectData = async (projectId: string) => {
    const [pPhases, pCosts, pTasks, pAllocations] = await Promise.all([
      getPhases(projectId),
      getProjectCosts(projectId),
      getProjectTasks(projectId),
      getAllocations()
    ]);
    
    const sortedPhases = pPhases.sort((a,b) => a.order - b.order);
    setPhases(sortedPhases);
    setProjectCosts(pCosts);
    
    // Auto-generate initial tasks if none exist but allocations do
    if (pTasks.length === 0 && pAllocations.length > 0) {
      const phaseIds = sortedPhases.map(p => p.id);
      const projectAllocations = pAllocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
      
      if (projectAllocations.length > 0) {
        setIsResetting(true);
        try {
          // Precalculate phase start dates
          const proj = projects.find(p => p.id === projectId);
          let currentDate = proj?.startDate || Date.now();
          const phaseStartDates: Record<string, number> = {};
          for (const p of sortedPhases) {
            phaseStartDates[p.id!] = currentDate;
            currentDate += p.durationWeeks * 7 * 24 * 60 * 60 * 1000;
          }

          const createPromises = projectAllocations.map(a => {
            const newTask = {
              projectId: projectId,
              phaseId: a.phaseId,
              memberId: a.memberId,
              name: 'Planned Task',
              startDate: phaseStartDates[a.phaseId] || Date.now(),
              description: '',
              includeWeekends: false,
              durationHours: a.hours,
              order: 0
            };
            return addProjectTask(newTask);
          });
          await Promise.all(createPromises);
          const newTasks = await getProjectTasks(projectId);
          setTasks(newTasks);
        } catch (error) {
          console.error("Auto generation failed:", error);
          setTasks([]);
        } finally {
          setIsResetting(false);
        }
        return;
      }
    }
    
    setTasks(pTasks);
  };

  
  const handleResetToBudget = () => {
    setShowResetConfirm(true);
  };

  const executeResetToBudget = async () => {
    setShowResetConfirm(false);
    if (!activeProjectId || !dbCompany) return;
    
    setIsResetting(true);
    
    const projectPhases = phases.filter(p => p.projectId === activeProjectId);
    const phaseIds = projectPhases.map(p => p.id);
    const projectAllocations = allocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
    const currentTasks = tasks.filter(t => t.projectId === activeProjectId);
    
    try {
      // 1. Delete all current tasks
      const deletePromises = currentTasks.map(t => deleteProjectTask(t.id!));
      await Promise.all(deletePromises);
      
      // 2. Create new tasks from allocations
      const proj = projects.find(p => p.id === activeProjectId);
      let currentDate = proj?.startDate || Date.now();
      const phaseStartDates: Record<string, number> = {};
      const sortedPhases = [...projectPhases].sort((a,b) => a.order - b.order);
      for (const p of sortedPhases) {
        phaseStartDates[p.id!] = currentDate;
        currentDate += p.durationWeeks * 7 * 24 * 60 * 60 * 1000;
      }

      const createPromises = projectAllocations.map(a => {
        const newTask = {
          projectId: activeProjectId,
          phaseId: a.phaseId,
          memberId: a.memberId,
          name: 'Planned Task',
          startDate: phaseStartDates[a.phaseId] || Date.now(),
          description: '',
          includeWeekends: false,
          durationHours: a.hours,
          order: 0
        };
        return addProjectTask(newTask);
      });
      await Promise.all(createPromises);
      
      // 3. Reload
      const pTasks = await getProjectTasks(activeProjectId);
      setTasks(pTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleTaskCreate = async (task: Omit<ProjectTask, 'id' | 'companyId'>) => {
    const tempTask = { ...task, id: 'temp-' + Date.now(), companyId: dbCompany?.id || '' };
    setTasks(prev => [...prev, tempTask as ProjectTask]);
    const id = await addProjectTask(task);
    setTasks(prev => prev.map(t => t.id === tempTask.id ? { ...t, id } : t));
  };

  
  const handleTaskDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteProjectTask(id);
  };

  const handleTaskUpdate = async (id: string, updates: Partial<ProjectTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await updateProjectTask(id, updates);
  };

  const handleSyncBudget = async () => {
    if (!activeProjectId || !dbCompany) return;
    setIsSyncing(true);
    
    const plannedAllocations: Record<string, number> = {};
    tasks.forEach(task => {
        const key = `${task.phaseId}_${task.memberId}`;
        plannedAllocations[key] = (plannedAllocations[key] || 0) + task.durationHours;
    });

    const projectPhases = phases.filter(p => p.projectId === activeProjectId);
    const phaseIds = projectPhases.map(p => p.id);
    const projectAllocations = allocations.filter(a => phaseIds.includes(a.phaseId));
    
    const promises = [];
    
    for (const key in plannedAllocations) {
        const [phaseId, memberId] = key.split('_');
        const plannedHours = plannedAllocations[key];
        
        const existing = projectAllocations.find(a => a.phaseId === phaseId && a.memberId === memberId);
        
        if (existing) {
            if (existing.hours !== plannedHours) {
                promises.push(updateAllocation(existing.id!, { hours: plannedHours }));
            }
        } else {
            promises.push(addAllocation({ projectId: activeProjectId, phaseId, memberId, hours: plannedHours, allocationType: 'hours', allocationValue: plannedHours }));
        }
    }
    
    for (const existing of projectAllocations) {
        const key = `${existing.phaseId}_${existing.memberId}`;
        if (!plannedAllocations[key] && existing.hours > 0) {
            promises.push(updateAllocation(existing.id!, { hours: 0 }));
        }
    }
    
    await Promise.all(promises);
    const updatedAllocations = await getAllocations();
    setAllocations(updatedAllocations);
    setIsSyncing(false);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading planner...</div>;

  if (dbCompany?.tier !== 'pro' && dbCompany?.subscriptionStatus !== 'lifetime') {
    return <ProUpgradePrompt 
      title="Advanced Project Planning" 
      description="The Gantt Planner lets you visually allocate team members on a timeline, skip weekends, and sync your planned hours perfectly with your budgeted fee proposal." 
    />;
  }

  if (!isPro) {
    
  return (
      <div className="flex h-full gap-6 mx-auto w-full p-8 items-center justify-center" style={{ maxWidth: '1600px' }}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
          <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
            <CalendarDays size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tight">Project Planning <span className="text-blue-600 dark:text-blue-400">Pro</span></h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Turn your fee proposals into actionable timelines. Assign tasks, drag-and-drop schedules, and ensure your team stays within the budgeted hours.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 mx-auto">
            <Lock size={18} />
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Top Project Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-30 shrink-0 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
            <CalendarDays size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm uppercase tracking-wider">Project Planning</span>
          </div>

          <div className="w-[320px] flex items-center">
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors cursor-pointer"
              value={activeProjectId || ''}
              onChange={(e) => {
                const newId = e.target.value;
                setActiveProjectId(newId);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  if (newId) {
                    url.searchParams.set('project', newId);
                  } else {
                    url.searchParams.delete('project');
                  }
                  window.history.replaceState({}, '', url.toString());
                }
              }}
            >
              {projects
                .filter(p => !p.isTemplate && (showLost || p.status !== "Lost"))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'Lost' ? ' (Lost/Archived)' : ''}
                  </option>
                ))}
            </select>
          </div>

          <button 
            type="button"
            onClick={() => setShowLost(!showLost)} 
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {showLost ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showLost ? 'Hide Lost/Archived' : 'Show Lost/Archived'}</span>
          </button>
        </div>

        {activeProjectId && (
          <button
            onClick={() => router.push(`/dashboard?project=${activeProjectId}`)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Open Fee Proposal"
          >
            <Calculator size={15} />
            <span className="hidden sm:inline">Fee Proposal</span>
          </button>
        )}
      </div>

      {/* Grid Canvas Area */}
      <div className="flex-1 overflow-hidden p-6 bg-slate-50 dark:bg-slate-950 flex flex-col">
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
          {activeProjectId ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Summary Header */}
              {(() => {
                 const project = projects.find(p => p.id === activeProjectId);
                 if (!project) return null;
                 const projectPhases = phases.filter(p => p.projectId === activeProjectId);
                 const phaseIds = projectPhases.map(p => p.id);
                 const projectAllocs = allocations.filter(a => phaseIds.includes(a.phaseId) && a.hours > 0);
                 const validProjectCosts = projectCosts.filter(c => phaseIds.includes(c.phaseId));
                 
                 const budgetedCost = projectAllocs.reduce((sum, a) => sum + (a.hours * getAllocationRate(a, members.find(m => m.id === a.memberId))), 0) + 
                    validProjectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
                 
                 const plannedCost = tasks.reduce((sum, t) => sum + (t.durationHours * (members.find(m => m.id === t.memberId)?.costPerHour || 0)), 0);
                 
                 const diff = budgetedCost - plannedCost;
                 const isOverBudget = diff < 0;

                 return (
                   <div className="flex items-start md:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 gap-6 flex-wrap md:flex-nowrap">
                     <div className="min-w-[200px] flex-1">
                       <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{project.name}</h2>
                       <p className="text-sm text-slate-500 mt-1">Resource & Task Planning</p>
                     </div>
                     <div className="flex items-center gap-6">
                       
                       <div className="flex flex-row items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
                          <button 
                             onClick={handleSyncBudget}
                             disabled={isSyncing}
                             className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm whitespace-nowrap"
                             title="Overwrite budget with planner tasks"
                          >
                             <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Update
                          </button>
                          <button onClick={handleResetToBudget} disabled={isResetting || loading} className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 rounded-md transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
                            <Undo2 size={16} className={isResetting ? "animate-spin" : ""} /> Reset
                          </button>
                          <button
                             onClick={() => {
                               if (collapsedPhases.size > 0) setCollapsedPhases(new Set());
                               else setCollapsedPhases(new Set(phases.map(p => p.id!)));
                             }}
                             className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap"
                          >
                             {collapsedPhases.size > 0 ? <><ChevronsRight size={16}/> Expand</> : <><ChevronsLeft size={16} /> Collapse</>}
                          </button>
                       </div>
                       <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Budgeted Cost</span>
                          <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(budgetedCost)}</span>
                       </div>
                       <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-6">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Planned Cost</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(plannedCost)}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Variance</span>
                          <span className={`text-lg font-bold ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(diff))}
                          </span>
                       </div>
                     </div>
                   </div>
                 );
              })()}
              <div className="flex-1 overflow-hidden relative">
                <GanttGrid 
                  collapsedPhases={collapsedPhases}
                  setCollapsedPhases={setCollapsedPhases}

                  project={projects.find(p => p.id === activeProjectId)!}
                  phases={phases}
                  members={members}
                  allocations={allocations.filter(a => phases.map(p => p.id).includes(a.phaseId))}
                  tasks={tasks}
                  onTaskCreate={handleTaskCreate}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-4 transition-colors">
              <CalendarDays size={48} className="text-slate-200 dark:text-slate-800" />
              <p>Select a project to view the planner.</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset to Budget"
        message="Are you sure you want to reset all tasks? This will delete all current tasks in the Gantt chart and recreate them to match the original budget allocations. This cannot be undone."
        confirmText="Reset Timeline"
        onConfirm={executeResetToBudget}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}

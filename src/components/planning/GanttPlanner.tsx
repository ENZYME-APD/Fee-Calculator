"use client";
import React, { useState, useEffect } from 'react';
import { Project, Phase, TeamMember, ProjectTask, Allocation, ProjectCost } from '@/lib/firebase/schema';
import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectTasks, addProjectTask, updateProjectTask, getProjectCosts, deleteProjectTask, addAllocation, updateAllocation } from '@/lib/firebase/db';
import { Folder, CalendarDays, Lock, Calculator, ChevronsRight, ChevronsLeft, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GanttGrid } from './GanttGrid';
import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';

export function GanttPlanner() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');
  const { dbCompany } = useAuth();
  const { formatCurrency } = useAppSettings();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId || null);
  const [isSyncing, setIsSyncing] = useState(false);
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
    setProjects(data.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  
  useEffect(() => {
    if (activeProjectId) {
      loadProjectData(activeProjectId);
    }
  }, [activeProjectId]);

  const loadProjectData = async (projectId: string) => {
    const [pPhases, pCosts, pTasks] = await Promise.all([
      getPhases(projectId),
      getProjectCosts(projectId),
      getProjectTasks(projectId)
    ]);
    setPhases(pPhases.sort((a,b) => a.order - b.order));
    setTasks(pTasks);
    setProjectCosts(pCosts);
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
    <div className="flex h-full gap-6 mx-auto w-full p-8" style={{ maxWidth: '1600px' }}>
      {/* Projects List - Reusing same style as ProjectManager */}
      <div className="w-80 shrink-0 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays size={20} className="text-blue-600 dark:text-blue-400" />
            Planning
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a project to plan tasks</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {projects.filter(p => !p.isTemplate).map(p => (
            <div 
              key={p.id}
              onClick={() => setActiveProjectId(p.id!)}
              className={`p-3.5 pb-2 rounded-xl cursor-pointer flex flex-col group transition-colors min-h-[64px] ${activeProjectId === p.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}
            >
              <div className="flex items-center justify-between gap-3 overflow-hidden w-full">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <Folder size={20} className={`shrink-0 ${activeProjectId === p.id ? "text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className={`font-semibold text-sm truncate ${activeProjectId === p.id ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{p.name}</span>
                </div>
                <div className="flex justify-end items-center gap-1 h-7 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard?project=${p.id}`); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors" title="Open Fee Proposal">
                    <Calculator size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        {activeProjectId ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Summary Header */}
            {(() => {
               const project = projects.find(p => p.id === activeProjectId)!;
               const projectAllocs = allocations.filter(a => a.projectId === activeProjectId);
               
               const budgetedCost = projectAllocs.reduce((sum, a) => sum + (a.hours * (members.find(m => m.id === a.memberId)?.costPerHour || 0)), 0) + 
                  projectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
               
               const plannedCost = tasks.reduce((sum, t) => sum + (t.durationHours * (members.find(m => m.id === t.memberId)?.costPerHour || 0)), 0);
               
               const diff = budgetedCost - plannedCost;
               const isOverBudget = diff < 0;

               return (
                 <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                   <div>
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{project.name}</h2>
                     <p className="text-sm text-slate-500 mt-1">Resource & Task Planning</p>
                   </div>
                   <div className="flex items-center gap-6">
                     
                     <div className="flex flex-row items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
                        <button 
                           onClick={handleSyncBudget}
                           disabled={isSyncing}
                           className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm"
                           title="Overwrite budget with planner tasks"
                        >
                           <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> Sync Budget
                        </button>
                        <button
                           onClick={() => {
                             if (collapsedPhases.size > 0) setCollapsedPhases(new Set());
                             else setCollapsedPhases(new Set(phases.map(p => p.id!)));
                           }}
                           className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                           {collapsedPhases.size > 0 ? <><ChevronsRight size={14} /> Expand All</> : <><ChevronsLeft size={14} /> Collapse All</>}
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
                allocations={allocations.filter(a => a.projectId === activeProjectId)}
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
  );
}

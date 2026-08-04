"use client";
import React, { useState } from 'react';
import { 
  DndContext, DragEndEvent, DragStartEvent, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import { TeamMember, Phase, Allocation, ProjectCost, Project } from '@/lib/firebase/schema';
import { addAllocation, addProjectCost, updateAllocation, deleteAllocation, deleteProjectCost } from '@/lib/firebase/db';
import { useUndo } from '@/lib/context/UndoContext';
import { DraggablePersonChip } from '../dnd/DraggablePersonChip';
import { DraggableCostChip } from '../dnd/DraggableCostChip';
import { DroppablePhaseLane } from '../dnd/DroppablePhaseLane';
import { AllocationModal } from '../modals/AllocationModal';
import { CostModal } from '../modals/CostModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { PanelLeftClose, PanelLeftOpen, Users, ChevronDown, ChevronRight, PlusCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategories } from '@/lib/firebase/db';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { TeamCategory } from '@/lib/firebase/schema';
import { Tooltip } from '@/components/ui/Tooltip';
interface AppLayoutProps {
  project?: Project | null;
  members: TeamMember[];
  phases: Phase[];
  allocations: Allocation[];
  projectCosts?: ProjectCost[];
  onAllocationAdded: () => void;
}

export function AppLayout({ project, members, phases, allocations, projectCosts = [], onAllocationAdded }: AppLayoutProps) {
  const { pushAction } = useUndo();
  const { formatCurrency } = useAppSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);
  
  // Sidebar accordion states (all expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAllocation, setPendingAllocation] = useState<{ member: TeamMember, phase: Phase, existing?: Allocation } | null>(null);
  const [allocationToDelete, setAllocationToDelete] = useState<string | null>(null);
  
  // Cost Modal State
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [pendingCost, setPendingCost] = useState<{ type: 'rendering' | 'trip' | 'consultant' | 'other', phase: Phase } | null>(null);
  const [activeCostTemplate, setActiveCostTemplate] = useState<'rendering' | 'trip' | 'consultant' | null>(null);

  const [categories, setCategories] = useState<TeamCategory[]>([]);

  React.useEffect(() => {
    getCategories().then(data => {
      setCategories(data);
    });
  }, []);

  // Group members by category
  const membersByCategory = React.useMemo(() => {
    const groups: Record<string, TeamMember[]> = {};
    members.forEach(m => {
      const cat = m.category || 'UNCATEGORIZED';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [members]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: prev[cat] === undefined ? true : !prev[cat] // If undefined, it means it's collapsed by default, so set to true
    }));
  };

  const handleCollapseAll = () => {
    const newState: Record<string, boolean> = {};
    Object.keys(membersByCategory).forEach(cat => newState[cat] = false);
    setExpandedCategories(newState);
    setIsTeamMenuOpen(false);
  };

  const handleExpandAll = () => {
    const newState: Record<string, boolean> = {};
    Object.keys(membersByCategory).forEach(cat => newState[cat] = true);
    setExpandedCategories(newState);
    setIsTeamMenuOpen(false);
  };

  const isExpanded = (cat: string) => expandedCategories[cat] === true; // false by default

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Person') {
      const member = members.find(m => `person-${m.id}` === active.id);
      if (member) setActiveMember(member);
    } else if (active.data.current?.type === 'CostTemplate') {
      setActiveCostTemplate(active.data.current.costType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMember(null);
    setActiveCostTemplate(null);
    const { active, over } = event;
    
    if (over && over.data.current?.type === 'Phase') {
      const phase = over.data.current.phase as Phase;
      
      if (active.data.current?.type === 'Person') {
        const member = active.data.current.member as TeamMember;
        setPendingAllocation({ member, phase });
        setIsModalOpen(true);
      } else if (active.data.current?.type === 'CostTemplate') {
        const type = active.data.current.costType as 'rendering' | 'trip' | 'consultant' | 'other';
        setPendingCost({ type, phase });
        setIsCostModalOpen(true);
      }
    }
  };

  const handleSaveAllocation = async (allocationData: Omit<Allocation, 'id' | 'phaseId' | 'memberId' | 'companyId' | 'projectId'>) => {
    if (pendingAllocation && pendingAllocation.phase.id && pendingAllocation.member.id) {
      if (pendingAllocation.existing && pendingAllocation.existing.id) {
        const oldData = { ...pendingAllocation.existing };
        const id = pendingAllocation.existing.id;
        await updateAllocation(id, allocationData);
        pushAction({
          name: 'Edit Allocation',
          undo: async () => {
            await updateAllocation(id, {
              allocationType: oldData.allocationType,
              allocationValue: oldData.allocationValue,
              hours: oldData.hours
            });
            onAllocationAdded();
          }
        });
      } else {
        const newId = await addAllocation({
          projectId: pendingAllocation.phase.projectId,
          phaseId: pendingAllocation.phase.id,
          memberId: pendingAllocation.member.id,
          ...allocationData
        });
        pushAction({
          name: 'Add Allocation',
          undo: async () => {
            await deleteAllocation(newId);
            onAllocationAdded();
          }
        });
      }
      onAllocationAdded();
    }
  };

  const handleEditAllocation = (alloc: Allocation, member: TeamMember, phase: Phase) => {
    setPendingAllocation({ member, phase, existing: alloc });
    setIsModalOpen(true);
  };

  const handleDeleteAllocation = async (id: string) => {
    setAllocationToDelete(id);
  };

  const confirmDeleteAllocation = async () => {
    if (allocationToDelete) {
      const allocObj = allocations.find(a => a.id === allocationToDelete);
      await deleteAllocation(allocationToDelete);
      if (allocObj) {
        pushAction({
          name: 'Remove Allocation',
          undo: async () => {
            const { id, ...rest } = allocObj;
            await addAllocation(rest);
            onAllocationAdded();
          }
        });
      }
      setAllocationToDelete(null);
      onAllocationAdded();
    }
  };

  const handleSaveCost = async (costData: Omit<ProjectCost, 'id' | 'phaseId' | 'projectId' | 'companyId'>) => {
    if (pendingCost && pendingCost.phase.id && pendingCost.phase.projectId) {
      const newId = await addProjectCost({
        projectId: pendingCost.phase.projectId,
        phaseId: pendingCost.phase.id,
        ...costData
      });
      pushAction({
        name: 'Add Cost',
        undo: async () => {
          await deleteProjectCost(newId);
          onAllocationAdded();
        }
      });
      onAllocationAdded(); // trigger data reload
    }
  };

  const handleDuplicateAllocation = async (allocation: Allocation, currentIndex: number) => {
    if (currentIndex + 1 < phases.length) {
      const nextPhase = phases[currentIndex + 1];
      const { id, ...allocData } = allocation;
      const newId = await addAllocation({ ...allocData, phaseId: nextPhase.id! });
      pushAction({
        name: 'Duplicate Allocation',
        undo: async () => {
          await deleteAllocation(newId);
          onAllocationAdded();
        }
      });
      onAllocationAdded();
    }
  };

  const handleDuplicateCost = async (cost: ProjectCost, currentIndex: number) => {
    if (currentIndex + 1 < phases.length) {
      const nextPhase = phases[currentIndex + 1];
      const { id, ...costData } = cost;
      const newId = await addProjectCost({ ...costData, phaseId: nextPhase.id! });
      pushAction({
        name: 'Duplicate Cost',
        undo: async () => {
          await deleteProjectCost(newId);
          onAllocationAdded();
        }
      });
      onAllocationAdded();
    }
  };

  const handleDuplicateAllAllocation = async (allocation: Allocation, currentIndex: number) => {
    const { id, ...allocData } = allocation;
    const promises = phases.map((phase, idx) => {
      if (idx !== currentIndex) {
        return addAllocation({ ...allocData, phaseId: phase.id! });
      }
      return Promise.resolve(null);
    });
    const newIds = (await Promise.all(promises)).filter(Boolean) as string[];
    pushAction({
      name: 'Duplicate Allocation to All',
      undo: async () => {
        await Promise.all(newIds.map(newId => deleteAllocation(newId)));
        onAllocationAdded();
      }
    });
    onAllocationAdded();
  };

  const handleDuplicateAllCost = async (cost: ProjectCost, currentIndex: number) => {
    const { id, ...costData } = cost;
    const promises = phases.map((phase, idx) => {
      if (idx !== currentIndex) {
        return addProjectCost({ ...costData, phaseId: phase.id! });
      }
      return Promise.resolve(null);
    });
    const newIds = (await Promise.all(promises)).filter(Boolean) as string[];
    pushAction({
      name: 'Duplicate Cost to All',
      undo: async () => {
        await Promise.all(newIds.map(newId => deleteProjectCost(newId)));
        onAllocationAdded();
      }
    });
    onAllocationAdded();
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full font-sans">
        {/* Sidebar */}
        <div 
          className={cn(
            "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 shrink-0 h-full",
            isSidebarOpen ? "w-80" : "w-0 overflow-hidden opacity-0"
          )}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0 transition-colors">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <PlusCircle size={16} />
              <h2 className="font-bold text-sm uppercase tracking-wider">Additional Costs</h2>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <DraggableCostChip type="rendering" />
            <DraggableCostChip type="trip" />
            <DraggableCostChip type="consultant" />
            <DraggableCostChip type="other" />
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0 transition-colors">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Users size={16} />
              <h2 className="font-bold text-sm uppercase tracking-wider">Team Resources</h2>
            </div>
            
            <div className="relative">
              <Tooltip content="Menu" position="left">
                <button 
                  onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  <Menu size={16} />
                </button>
              </Tooltip>
              
              {isTeamMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTeamMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 overflow-hidden">
                    <button onClick={handleExpandAll} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Open all</button>
                    <button onClick={handleCollapseAll} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Collapse all</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white dark:bg-slate-900 transition-colors">
            {members.length === 0 && <div className="text-center text-sm text-slate-400 dark:text-slate-500 p-4 font-medium border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No team members available. Go to Team Resources to add some.</div>}
            
            {Object.entries(membersByCategory)
              .sort(([catA], [catB]) => {
                const orderA = categories.find(c => c.id === catA)?.order ?? 99;
                const orderB = categories.find(c => c.id === catB)?.order ?? 99;
                return orderA - orderB;
              })
              .map(([category, catMembers]) => {
                const displayCat = categories.find(c => c.id === category)?.name || (category === 'UNCATEGORIZED' ? 'Uncategorized' : category);
                const displayColor = categories.find(c => c.id === category)?.color || '#94a3b8';
                return (
              <div key={category} className="flex flex-col gap-1.5">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {isExpanded(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {displayCat} ({catMembers.length})
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 mr-1" style={{ backgroundColor: displayColor }} />
                </button>
                
                {isExpanded(category) && (
                  <div className="flex flex-col gap-1.5 pl-1">
                    {catMembers.map(member => (
                      <DraggablePersonChip key={member.id} member={member} />
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full relative">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 left-4 z-30 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}

          {/* Canvas */}
          <main className="flex-1 relative bg-slate-50 dark:bg-black">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95 dark:opacity-20 pointer-events-none transition-opacity" />
            
            <div className="absolute inset-0 overflow-x-hidden overflow-y-auto p-8 z-10">
              {project && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{project.name}</h2>
                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      {project.status || 'Draft'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Cost</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {formatCurrency(
                        allocations.filter(a => a.projectId === project.id).reduce((sum, a) => sum + (a.hours * (members.find(m => m.id === a.memberId)?.costPerHour || 0)), 0) + 
                        projectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 items-start pb-12">
                {phases.length === 0 ? (
                  <div className="text-slate-500 dark:text-slate-400 flex items-center justify-center w-full h-full font-medium">This project has no phases yet. Add some in the Projects tab.</div>
                ) : (
                  phases.map((phase, index) => {
                    const phaseAllocations = allocations
                      .filter(a => a.phaseId === phase.id)
                      .map(a => ({
                        ...a,
                        member: members.find(m => m.id === a.memberId)!
                      }))
                      .filter(a => a.member); // Filter out if member was deleted
                      
                    const phaseCosts = projectCosts.filter(c => c.phaseId === phase.id);
                      
                    return (
                      <DroppablePhaseLane 
                        key={phase.id}
                        phase={phase} 
                        allocations={phaseAllocations}
                        projectCosts={phaseCosts}
                        onUpdated={onAllocationAdded}
                        onEditAllocation={(alloc, member) => handleEditAllocation(alloc, member, phase)}
                        onDeleteAllocation={setAllocationToDelete}
                        hasNextPhase={index < phases.length - 1}
                        onDuplicateAllocation={(alloc) => handleDuplicateAllocation(alloc, index)}
                        onDuplicateCost={(cost) => handleDuplicateCost(cost, index)}
                        onDuplicateAllAllocation={phases.length > 1 ? (alloc) => handleDuplicateAllAllocation(alloc, index) : undefined}
                        onDuplicateAllCost={phases.length > 1 ? (cost) => handleDuplicateAllCost(cost, index) : undefined}
                        categories={categories}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
        
        {/* Modals and Overlays */}
        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeMember ? (
            <div className="opacity-95 scale-105 rotate-3 shadow-2xl cursor-grabbing">
              <DraggablePersonChip member={activeMember} />
            </div>
          ) : activeCostTemplate ? (
            <div className="opacity-95 scale-105 rotate-3 shadow-2xl cursor-grabbing">
              <DraggableCostChip type={activeCostTemplate} />
            </div>
          ) : null}
        </DragOverlay>

        <AllocationModal
          isOpen={isModalOpen}
          member={pendingAllocation?.member || null}
          phase={pendingAllocation?.phase || null}
          initialData={pendingAllocation?.existing || null}
          onClose={() => {
            setIsModalOpen(false);
            setPendingAllocation(null);
          }}
          onSave={handleSaveAllocation}
        />
        
        <CostModal
          isOpen={isCostModalOpen}
          type={pendingCost?.type || null}
          phase={pendingCost?.phase || null}
          onClose={() => {
            setIsCostModalOpen(false);
            setPendingCost(null);
          }}
          onSave={handleSaveCost}
        />

        <ConfirmModal
          isOpen={!!allocationToDelete}
          title="Remove Team Member"
          message="Are you sure you want to remove this team member from the phase? Their allocated hours and cost will be deducted from your fee proposal."
          confirmText="Remove"
          onConfirm={confirmDeleteAllocation}
          onCancel={() => setAllocationToDelete(null)}
        />
      </div>
    </DndContext>
  );
}

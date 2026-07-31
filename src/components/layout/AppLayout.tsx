"use client";
import React, { useState } from 'react';
import { 
  DndContext, DragEndEvent, DragStartEvent, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import { TeamMember, Phase, Allocation, ProjectCost } from '@/lib/firebase/schema';
import { addAllocation, addProjectCost, updateAllocation, deleteAllocation } from '@/lib/firebase/db';
import { DraggablePersonChip } from '../dnd/DraggablePersonChip';
import { DraggableCostChip } from '../dnd/DraggableCostChip';
import { DroppablePhaseLane } from '../dnd/DroppablePhaseLane';
import { AllocationModal } from '../modals/AllocationModal';
import { CostModal } from '../modals/CostModal';
import { PanelLeftClose, PanelLeftOpen, Users, ChevronDown, ChevronRight, PlusCircle, Menu } from 'lucide-react';
import { cn, getCategoryOrder } from '@/lib/utils';

interface AppLayoutProps {
  members: TeamMember[];
  phases: Phase[];
  allocations: Allocation[];
  projectCosts?: ProjectCost[];
  onAllocationAdded: () => void;
}

export function AppLayout({ members, phases, allocations, projectCosts = [], onAllocationAdded }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);
  
  // Sidebar accordion states (all expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAllocation, setPendingAllocation] = useState<{ member: TeamMember, phase: Phase, existing?: Allocation } | null>(null);
  
  // Cost Modal State
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [pendingCost, setPendingCost] = useState<{ type: 'rendering' | 'trip' | 'consultant', phase: Phase } | null>(null);
  const [activeCostTemplate, setActiveCostTemplate] = useState<'rendering' | 'trip' | 'consultant' | null>(null);

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
      [cat]: prev[cat] === undefined ? false : !prev[cat] // If undefined, it means it's expanded by default, so set to false
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

  const isExpanded = (cat: string) => expandedCategories[cat] !== false; // true by default

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
        const type = active.data.current.costType as 'rendering' | 'trip' | 'consultant';
        setPendingCost({ type, phase });
        setIsCostModalOpen(true);
      }
    }
  };

  const handleSaveAllocation = async (allocationData: Omit<Allocation, 'id' | 'phaseId' | 'memberId' | 'companyId' | 'projectId'>) => {
    if (pendingAllocation && pendingAllocation.phase.id && pendingAllocation.member.id) {
      if (pendingAllocation.existing && pendingAllocation.existing.id) {
        await updateAllocation(pendingAllocation.existing.id, allocationData);
      } else {
        await addAllocation({
          projectId: pendingAllocation.phase.projectId,
          phaseId: pendingAllocation.phase.id,
          memberId: pendingAllocation.member.id,
          ...allocationData
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
    if (confirm('Remove this team member from the phase?')) {
      await deleteAllocation(id);
      onAllocationAdded();
    }
  };

  const handleSaveCost = async (costData: Omit<ProjectCost, 'id' | 'phaseId' | 'projectId' | 'companyId'>) => {
    if (pendingCost && pendingCost.phase.id && pendingCost.phase.projectId) {
      await addProjectCost({
        projectId: pendingCost.phase.projectId,
        phaseId: pendingCost.phase.id,
        ...costData
      });
      onAllocationAdded(); // trigger data reload
    }
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
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0 transition-colors">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Users size={16} />
              <h2 className="font-bold text-sm uppercase tracking-wider">Team Resources</h2>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <Menu size={16} />
              </button>
              
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
              .sort(([catA], [catB]) => getCategoryOrder(catA) - getCategoryOrder(catB))
              .map(([category, catMembers]) => (
              <div key={category} className="flex flex-col gap-1.5">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {isExpanded(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {category} ({catMembers.length})
                </button>
                
                {isExpanded(category) && (
                  <div className="flex flex-col gap-1.5 pl-1">
                    {catMembers.map(member => (
                      <DraggablePersonChip key={member.id} member={member} />
                    ))}
                  </div>
                )}
              </div>
            ))}
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
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 items-start pb-12">
                {phases.length === 0 ? (
                  <div className="text-slate-500 dark:text-slate-400 flex items-center justify-center w-full h-full font-medium">This project has no phases yet. Add some in the Projects tab.</div>
                ) : (
                  phases.map(phase => {
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
                        onDeleteAllocation={handleDeleteAllocation}
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
      </div>
    </DndContext>
  );
}

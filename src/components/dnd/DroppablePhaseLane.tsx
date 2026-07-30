import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Phase, Allocation, TeamMember, ProjectCost } from '@/lib/firebase/schema';
import { deleteProjectCost, updateProjectCost } from '@/lib/firebase/db';
import { CostModal } from '../modals/CostModal';
import { Palette, Plane, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { cn, getCategoryOrder } from '@/lib/utils';

interface DroppablePhaseLaneProps {
  phase: Phase;
  allocations: (Allocation & { member: TeamMember })[];
  projectCosts?: ProjectCost[];
  onUpdated?: () => void;
  onEditAllocation?: (alloc: Allocation, member: TeamMember) => void;
  onDeleteAllocation?: (id: string) => void;
}

export function DroppablePhaseLane({ phase, allocations, projectCosts = [], onUpdated, onEditAllocation, onDeleteAllocation }: DroppablePhaseLaneProps) {
  const [editingCost, setEditingCost] = useState<ProjectCost | null>(null);

  const { isOver, setNodeRef } = useDroppable({
    id: `phase-${phase.id}`,
    data: {
      type: 'Phase',
      phase,
    },
  });

  const baseCost = allocations.reduce((sum, a) => sum + (a.hours * a.member.costPerHour), 0);
  
  const addedCost = projectCosts.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);
  
  const totalCost = baseCost + addedCost;

  const baseCostPercent = totalCost > 0 ? (baseCost / totalCost) * 100 : 0;
  const addedCostPercent = totalCost > 0 ? (addedCost / totalCost) * 100 : 0;

  const handleDeleteCost = async (id: string) => {
    if (confirm('Delete this cost?')) {
      await deleteProjectCost(id);
      if (onUpdated) onUpdated();
    }
  };

  const handleUpdateCost = async (costData: any) => {
    if (editingCost && editingCost.id) {
      await updateProjectCost(editingCost.id, costData);
      if (onUpdated) onUpdated();
    }
  };

  const getCostIcon = (type: string) => {
    if (type === 'rendering') return <Palette size={16} className="text-pink-500" />;
    if (type === 'trip') return <Plane size={16} className="text-sky-500" />;
    return <Briefcase size={16} className="text-purple-500" />;
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-full bg-slate-50/70 dark:bg-slate-900/70 rounded-2xl border-2 border-dashed p-5 transition-all snap-center",
        isOver ? "border-blue-400 bg-blue-50/70 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{phase.name}</h3>
        <div className="flex items-center text-right bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cost: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      {/* Cost Breakdown Bar */}
      <div className="mb-5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <span className="text-blue-600 dark:text-blue-400">Team: ${baseCost.toLocaleString()}</span>
          <span className="text-orange-500 dark:text-orange-400">Other: ${addedCost.toLocaleString()}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-500" 
            style={{ width: `${baseCostPercent}%` }}
          />
          <div 
            className="h-full bg-orange-400 dark:bg-orange-500 transition-all duration-500" 
            style={{ width: `${addedCostPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          <span>{baseCostPercent.toFixed(1)}%</span>
          <span>{addedCostPercent.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[300px]">
        {allocations
          .slice()
          .sort((a, b) => getCategoryOrder(a.member.category) - getCategoryOrder(b.member.category))
          .map(allocation => (
          <div key={allocation.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{allocation.member.name}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{allocation.hours} hrs</span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">${(allocation.hours * allocation.member.costPerHour).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">@ ${allocation.member.costPerHour}/h</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4 pl-3 border-l border-slate-100 dark:border-slate-700">
              <button onClick={() => onEditAllocation && onEditAllocation(allocation, allocation.member)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDeleteAllocation && allocation.id && onDeleteAllocation(allocation.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {projectCosts.length > 0 && (
          <div className="mt-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Project Costs</h4>
            {projectCosts.map(cost => (
              <div key={cost.id} className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {getCostIcon(cost.type)}
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{cost.name}</span>
                  </div>
                  {cost.type !== 'consultant' && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{cost.quantity} × ${cost.unitCost.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">${(cost.quantity * cost.unitCost).toLocaleString()}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCost(cost)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => cost.id && handleDeleteCost(cost.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {allocations.length === 0 && projectCosts.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[150px] text-slate-400 dark:text-slate-500 text-sm font-medium border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            Drop team members or costs here
          </div>
        )}
      </div>

      <CostModal
        isOpen={!!editingCost}
        type={editingCost?.type || null}
        phase={phase}
        initialData={editingCost}
        onClose={() => setEditingCost(null)}
        onSave={handleUpdateCost}
      />
    </div>
  );
}

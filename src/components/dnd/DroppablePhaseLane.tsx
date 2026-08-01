import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Phase, Allocation, TeamMember, ProjectCost, TeamCategory } from '@/lib/firebase/schema';
import { deleteProjectCost, updateProjectCost } from '@/lib/firebase/db';
import { CostModal } from '../modals/CostModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { Palette, Plane, Briefcase, Pencil, Trash2, ArrowRight, CopyPlus } from 'lucide-react';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

interface DroppablePhaseLaneProps {
  phase: Phase;
  allocations: (Allocation & { member: TeamMember })[];
  projectCosts?: ProjectCost[];
  onUpdated?: () => void;
  onEditAllocation?: (alloc: Allocation, member: TeamMember) => void;
  onDeleteAllocation?: (id: string) => void;
  hasNextPhase?: boolean;
  onDuplicateAllocation?: (alloc: Allocation) => void;
  onDuplicateCost?: (cost: ProjectCost) => void;
  onDuplicateAllAllocation?: (alloc: Allocation) => void;
  onDuplicateAllCost?: (cost: ProjectCost) => void;
  categories?: TeamCategory[];
}

export function DroppablePhaseLane({ phase, allocations, projectCosts = [], onUpdated, onEditAllocation, onDeleteAllocation, hasNextPhase, onDuplicateAllocation, onDuplicateCost, onDuplicateAllAllocation, onDuplicateAllCost, categories = [] }: DroppablePhaseLaneProps) {
  const { formatCurrency } = useAppSettings();
  const [editingCost, setEditingCost] = useState<ProjectCost | null>(null);
  const [costToDelete, setCostToDelete] = useState<string | null>(null);

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

  let costMgmt = 0;
  let costGlobal = 0;
  let costJakarta = 0;
  let costConsult = 0;

  allocations.forEach(a => {
    const cost = a.hours * a.member.costPerHour;
    const cat = (a.member.category || '').toUpperCase();
    if (cat.includes('MANAGEMENT')) costMgmt += cost;
    else if (cat.includes('GLOBAL')) costGlobal += cost;
    else if (cat.includes('JAKARTA')) costJakarta += cost;
    else if (cat.includes('CONSULTANT')) costConsult += cost;
  });

  const pMgmt = totalCost > 0 ? (costMgmt / totalCost) * 100 : 0;
  const pGlobal = totalCost > 0 ? (costGlobal / totalCost) * 100 : 0;
  const pJakarta = totalCost > 0 ? (costJakarta / totalCost) * 100 : 0;
  const pConsult = totalCost > 0 ? (costConsult / totalCost) * 100 : 0;

  const confirmDeleteCost = async () => {
    if (costToDelete) {
      await deleteProjectCost(costToDelete);
      setCostToDelete(null);
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
        <div className="flex-1 pr-4 min-w-0">
          <h3 className="font-bold text-base leading-tight text-slate-800 dark:text-slate-200 break-words mb-1.5">{phase.name}</h3>
          <span className="inline-block px-1.5 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {phase.durationWeeks} {phase.durationWeeks === 1 ? 'Week' : 'Weeks'}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Cost</div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(totalCost)}</span>
        </div>
      </div>
      
      {/* Cost Breakdown Bar */}
      <div className="mb-5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center text-[10px] font-bold px-2 py-1 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <span className="text-blue-600 dark:text-blue-400">Team: {formatCurrency(baseCost)}</span>
          <span className="text-orange-500 dark:text-orange-400">Other: {formatCurrency(addedCost)}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
          {pMgmt > 0 && <div style={{width: `${pMgmt}%`}} className="bg-blue-600 transition-all hover:opacity-90" title={`Management: ${pMgmt.toFixed(1)}%`} />}
          {pGlobal > 0 && <div style={{width: `${pGlobal}%`}} className="bg-blue-500 transition-all hover:opacity-90" title={`Team Global: ${pGlobal.toFixed(1)}%`} />}
          {pJakarta > 0 && <div style={{width: `${pJakarta}%`}} className="bg-blue-400 transition-all hover:opacity-90" title={`Team Jakarta: ${pJakarta.toFixed(1)}%`} />}
          {pConsult > 0 && <div style={{width: `${pConsult}%`}} className="bg-emerald-400 transition-all hover:opacity-90" title={`Consultants: ${pConsult.toFixed(1)}%`} />}
          {addedCostPercent > 0 && <div style={{width: `${addedCostPercent}%`}} className="bg-orange-400 dark:bg-orange-500 transition-all hover:opacity-90" title={`Project Costs: ${addedCostPercent.toFixed(1)}%`} />}
        </div>
        <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          <span>{baseCostPercent.toFixed(1)}%</span>
          <span>{addedCostPercent.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[300px]">
        {allocations
          .slice()
          .sort((a, b) => {
            const orderA = categories.find(c => c.name === a.member.category)?.order ?? 99;
            const orderB = categories.find(c => c.name === b.member.category)?.order ?? 99;
            return orderA - orderB;
          })
          .map(allocation => (
          <div key={allocation.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{allocation.member.name}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{allocation.hours} hrs</span>
            </div>
            <div className="flex flex-col items-end pr-2 pl-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cost</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(allocation.hours * allocation.member.costPerHour)}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">@ {formatCurrency(allocation.member.costPerHour)}/h</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pl-2 border-l border-slate-100 dark:border-slate-700 shrink-0">
              {onDuplicateAllAllocation ? (
                <button onClick={() => onDuplicateAllAllocation(allocation)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center" title="Duplicate to all phases">
                  <CopyPlus size={14} />
                </button>
              ) : <div />}
              
              {hasNextPhase && onDuplicateAllocation ? (
                <button onClick={() => onDuplicateAllocation(allocation)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center" title="Duplicate to next phase">
                  <ArrowRight size={14} />
                </button>
              ) : <div />}
              
              <button onClick={() => onEditAllocation && onEditAllocation(allocation, allocation.member)} className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors flex justify-center" title="Edit">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDeleteAllocation && allocation.id && onDeleteAllocation(allocation.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors flex justify-center" title="Delete">
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cost.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{cost.quantity} × {formatCurrency(cost.unitCost)}</span>
                </div>
                <div className="flex flex-col items-end pr-2 pl-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cost</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(cost.quantity * cost.unitCost)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pl-2 border-l border-slate-100 dark:border-slate-700 shrink-0">
                  {onDuplicateAllCost ? (
                    <button onClick={() => onDuplicateAllCost(cost)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center" title="Duplicate to all phases">
                      <CopyPlus size={14} />
                    </button>
                  ) : <div />}
                  
                  {hasNextPhase && onDuplicateCost ? (
                    <button onClick={() => onDuplicateCost(cost)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center" title="Duplicate to next phase">
                      <ArrowRight size={14} />
                    </button>
                  ) : <div />}
                  
                  <button onClick={() => setEditingCost(cost)} className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors flex justify-center" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => cost.id && setCostToDelete(cost.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors flex justify-center" title="Delete">
                    <Trash2 size={14} />
                  </button>
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

      <ConfirmModal
        isOpen={!!costToDelete}
        title="Delete Cost"
        message="Are you sure you want to delete this expense? This action cannot be undone and will affect your final fee."
        confirmText="Delete"
        onConfirm={confirmDeleteCost}
        onCancel={() => setCostToDelete(null)}
      />
    </div>
  );
}

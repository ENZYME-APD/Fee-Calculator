import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Allocation, TeamMember } from '@/lib/firebase/schema';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { Copy, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExtendedAllocation = Allocation & { member: TeamMember };

interface DraggablePhaseAllocationChipProps {
  allocation: ExtendedAllocation;
  hasNextPhase: boolean;
  onDuplicateAllAllocation?: (allocation: Allocation) => void;
  onDuplicateAllocation?: (allocation: Allocation) => void;
  onEditAllocation?: (allocation: Allocation, member: TeamMember) => void;
  onDeleteAllocation?: (id: string) => void;
}

export function DraggablePhaseAllocationChip({
  allocation,
  hasNextPhase,
  onDuplicateAllAllocation,
  onDuplicateAllocation,
  onEditAllocation,
  onDeleteAllocation
}: DraggablePhaseAllocationChipProps) {
  const { formatCurrency } = useAppSettings();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `existing-allocation-${allocation.id}`,
    data: {
      type: 'ExistingAllocation',
      allocation,
      sourcePhaseId: allocation.phaseId
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-blue-500 shadow-lg scale-105"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{allocation.member.name}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{Number(allocation.hours.toFixed(1))} hrs</span>
      </div>
      <div className="flex flex-col items-end pr-2 pl-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cost</span>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(allocation.hours * allocation.member.costPerHour)}</span>
        <span className="text-[10px] text-slate-400 font-medium mt-0.5">@ {formatCurrency(allocation.member.costPerHour)}/h</span>
      </div>
      
      {/* We stop propagation on pointer down so that clicking buttons doesn't initiate a drag */}
      <div 
        className="grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pl-2 border-l border-slate-100 dark:border-slate-700 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {onDuplicateAllAllocation && (
          <Tooltip content="Duplicate to all phases" position="top">
            <button onClick={() => onDuplicateAllAllocation(allocation)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center">
              <Copy size={12} />
            </button>
          </Tooltip>
        )}
        {hasNextPhase && onDuplicateAllocation && (
          <Tooltip content="Duplicate to next phase" position="top">
            <button onClick={() => onDuplicateAllocation(allocation)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center">
              <ArrowRight size={12} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Edit" position="top">
          <button onClick={() => onEditAllocation && onEditAllocation(allocation, allocation.member)} className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors flex justify-center">
            <Pencil size={12} />
          </button>
        </Tooltip>
        <Tooltip content="Delete" position="top">
          <button onClick={() => onDeleteAllocation && allocation.id && onDeleteAllocation(allocation.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors flex justify-center">
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

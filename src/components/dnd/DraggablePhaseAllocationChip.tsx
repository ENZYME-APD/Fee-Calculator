import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Allocation, TeamMember } from '@/lib/firebase/schema';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { Copy, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllocationRate } from '@/lib/utils/allocationCost';

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
        "bg-white dark:bg-ink-800 p-3.5 rounded-xl border border-ink-200 dark:border-ink-700 flex justify-between items-center group hover:border-accent-300 dark:hover:border-accent-700 transition-colors relative hover:z-50 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-accent-500 shadow-lg scale-105"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-ink-700 dark:text-ink-200 text-sm">{allocation.member.name}</span>
        <span className="text-xs font-medium text-ink-500 dark:text-ink-400 mt-0.5">{Number(allocation.hours.toFixed(1))} hrs</span>
      </div>
      <div className="flex flex-col items-end pr-2 pl-2">
        <span className="text-xs font-medium text-ink-500 mb-0.5">Cost</span>
        <span className="text-sm font-bold text-ink-700 dark:text-ink-300">{formatCurrency(allocation.hours * getAllocationRate(allocation, allocation.member))}</span>
        <span className="text-[10px] text-ink-500 font-medium mt-0.5">@ {formatCurrency(getAllocationRate(allocation, allocation.member))}/h</span>
      </div>
      
      {/* We stop propagation on pointer down so that clicking buttons doesn't initiate a drag */}
      <div 
        className="grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pl-2 border-l border-ink-100 dark:border-ink-700 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {onDuplicateAllAllocation && (
          <Tooltip content="Duplicate to all phases" position="top">
            <button onClick={() => onDuplicateAllAllocation(allocation)} className="p-1 text-ink-500 hover:text-positive-600 rounded hover:bg-positive-50 transition-colors flex justify-center">
              <Copy size={12} />
            </button>
          </Tooltip>
        )}
        {hasNextPhase && onDuplicateAllocation && (
          <Tooltip content="Duplicate to next phase" position="top">
            <button onClick={() => onDuplicateAllocation(allocation)} className="p-1 text-ink-500 hover:text-positive-600 rounded hover:bg-positive-50 transition-colors flex justify-center">
              <ArrowRight size={12} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Edit" position="top">
          <button onClick={() => onEditAllocation && onEditAllocation(allocation, allocation.member)} className="p-1 text-ink-500 hover:text-accent-600 rounded hover:bg-accent-50 transition-colors flex justify-center">
            <Pencil size={12} />
          </button>
        </Tooltip>
        <Tooltip content="Delete" position="top">
          <button onClick={() => onDeleteAllocation && allocation.id && onDeleteAllocation(allocation.id)} className="p-1 text-ink-500 hover:text-negative-600 rounded hover:bg-negative-50 transition-colors flex justify-center">
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

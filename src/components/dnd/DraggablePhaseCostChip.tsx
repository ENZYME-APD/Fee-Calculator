import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ProjectCost } from '@/lib/firebase/schema';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { Copy, ArrowRight, Pencil, Trash2, Palette, Plane, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggablePhaseCostChipProps {
  cost: ProjectCost;
  hasNextPhase: boolean;
  onDuplicateAllCost?: (cost: ProjectCost) => void;
  onDuplicateCost?: (cost: ProjectCost) => void;
  onEditCost?: (cost: ProjectCost) => void;
  onDeleteCost?: (id: string) => void;
}

export function DraggablePhaseCostChip({
  cost,
  hasNextPhase,
  onDuplicateAllCost,
  onDuplicateCost,
  onEditCost,
  onDeleteCost
}: DraggablePhaseCostChipProps) {
  const { formatCurrency } = useAppSettings();

  const getCostIcon = (type: string) => {
    if (type === 'rendering') return <Palette size={16} className="text-clay-500" />;
    if (type === 'trip') return <Plane size={16} className="text-accent-500" />;
    return <Briefcase size={16} className="text-info-500" />;
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `existing-cost-${cost.id}`,
    data: {
      type: 'ExistingCost',
      cost,
      sourcePhaseId: cost.phaseId
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
        "bg-ink-50 dark:bg-ink-800/50 p-3.5 rounded-xl border border-ink-200 dark:border-ink-700 flex justify-between items-center group hover:border-accent-300 dark:hover:border-accent-700 transition-colors relative hover:z-50 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-accent-500 shadow-lg scale-105"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {getCostIcon(cost.type)}
          <span className="font-semibold text-sm text-ink-800 dark:text-ink-200">{cost.name}</span>
        </div>
        <span className="text-xs font-medium text-ink-500 dark:text-ink-400 mt-1">{cost.quantity} × {formatCurrency(cost.unitCost)}</span>
      </div>
      <div className="flex flex-col items-end pr-2 pl-2">
        <span className="text-xs font-medium text-ink-500 mb-0.5">Cost</span>
        <span className="text-sm font-bold text-ink-700 dark:text-ink-300">{formatCurrency(cost.quantity * cost.unitCost)}</span>
      </div>
      
      {/* We stop propagation on pointer down so that clicking buttons doesn't initiate a drag */}
      <div 
        className="grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pl-2 border-l border-ink-100 dark:border-ink-700 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {onDuplicateAllCost && (
          <Tooltip content="Duplicate to all phases" position="top">
            <button onClick={() => onDuplicateAllCost(cost)} className="p-1 text-ink-500 hover:text-positive-600 rounded hover:bg-positive-50 transition-colors flex justify-center">
              <Copy size={12} />
            </button>
          </Tooltip>
        )}
        {hasNextPhase && onDuplicateCost && (
          <Tooltip content="Duplicate to next phase" position="top">
            <button onClick={() => onDuplicateCost(cost)} className="p-1 text-ink-500 hover:text-positive-600 rounded hover:bg-positive-50 transition-colors flex justify-center">
              <ArrowRight size={12} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Edit" position="top">
          <button onClick={() => onEditCost && onEditCost(cost)} className="p-1 text-ink-500 hover:text-accent-600 rounded hover:bg-accent-50 transition-colors flex justify-center">
            <Pencil size={12} />
          </button>
        </Tooltip>
        <Tooltip content="Delete" position="top">
          <button onClick={() => onDeleteCost && cost.id && onDeleteCost(cost.id)} className="p-1 text-ink-500 hover:text-negative-600 rounded hover:bg-negative-50 transition-colors flex justify-center">
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

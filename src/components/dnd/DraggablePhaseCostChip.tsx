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
    if (type === 'rendering') return <Palette size={16} className="text-pink-500" />;
    if (type === 'trip') return <Plane size={16} className="text-sky-500" />;
    return <Briefcase size={16} className="text-purple-500" />;
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
        "bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-blue-500 shadow-lg scale-105"
      )}
      {...listeners}
      {...attributes}
    >
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
      
      {/* We stop propagation on pointer down so that clicking buttons doesn't initiate a drag */}
      <div 
        className="grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 pl-2 border-l border-slate-100 dark:border-slate-700 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {onDuplicateAllCost && (
          <Tooltip content="Duplicate to all phases" position="top">
            <button onClick={() => onDuplicateAllCost(cost)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center">
              <Copy size={12} />
            </button>
          </Tooltip>
        )}
        {hasNextPhase && onDuplicateCost && (
          <Tooltip content="Duplicate to next phase" position="top">
            <button onClick={() => onDuplicateCost(cost)} className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors flex justify-center">
              <ArrowRight size={12} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Edit" position="top">
          <button onClick={() => onEditCost && onEditCost(cost)} className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors flex justify-center">
            <Pencil size={12} />
          </button>
        </Tooltip>
        <Tooltip content="Delete" position="top">
          <button onClick={() => onDeleteCost && cost.id && onDeleteCost(cost.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors flex justify-center">
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

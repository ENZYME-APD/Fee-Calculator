import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Palette, Plane, Briefcase, GripVertical, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableCostChipProps {
  type: 'rendering' | 'trip' | 'consultant' | 'other';
}

export function DraggableCostChip({ type }: DraggableCostChipProps) {
  const id = `cost-template-${type}`;
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      type: 'CostTemplate',
      costType: type
    }
  });

  const config = {
    rendering: { label: 'Rendering', icon: Palette, color: 'text-clay-600 dark:text-clay-400', bg: 'bg-clay-50', border: 'border-clay-100 dark:border-clay-900/30', iconBg: 'bg-clay-100 dark:bg-clay-500/10' },
    trip: { label: 'Trip', icon: Plane, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50', border: 'border-accent-100 dark:border-accent-900/30', iconBg: 'bg-accent-100 dark:bg-accent-500/10' },
    consultant: { label: 'Consultant', icon: Briefcase, color: 'text-info-600 dark:text-info-400', bg: 'bg-info-50', border: 'border-info-100 dark:border-info-900/30', iconBg: 'bg-info-100 dark:bg-info-500/10' },
    other: { label: 'Other Expense', icon: Receipt, color: 'text-positive-600 dark:text-positive-400', bg: 'bg-positive-50', border: 'border-positive-100 dark:border-positive-900/30', iconBg: 'bg-positive-100 dark:bg-positive-500/10' }
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-xl border bg-white dark:bg-ink-800 cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity group",
        style.border,
        isDragging && "opacity-50 ring-2 ring-accent-500 ring-offset-2 scale-95 shadow-lg"
      )}
    >
      <div className={cn("p-2 rounded-lg flex items-center justify-center transition-colors group-hover:scale-110", style.iconBg, style.color)}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200">{style.label}</h3>
        <p className="text-[11px] font-medium text-ink-500 dark:text-ink-400">Drag to phase</p>
      </div>
      <div className="text-ink-300 dark:text-ink-600 group-hover:text-ink-400 dark:group-hover:text-ink-400 transition-colors">
        <GripVertical size={16} />
      </div>
    </div>
  );
}

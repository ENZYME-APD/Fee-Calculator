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
    rendering: { label: 'Rendering', icon: Palette, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50', border: 'border-pink-100 dark:border-pink-900/30', iconBg: 'bg-pink-100 dark:bg-pink-500/10' },
    trip: { label: 'Trip', icon: Plane, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50', border: 'border-sky-100 dark:border-sky-900/30', iconBg: 'bg-sky-100 dark:bg-sky-500/10' },
    consultant: { label: 'Consultant', icon: Briefcase, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50', border: 'border-purple-100 dark:border-purple-900/30', iconBg: 'bg-purple-100 dark:bg-purple-500/10' },
    other: { label: 'Other Expense', icon: Receipt, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-100 dark:border-emerald-900/30', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10' }
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-xl border bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        style.border,
        isDragging && "opacity-50 ring-2 ring-blue-500 ring-offset-2 scale-95 shadow-sm"
      )}
    >
      <div className={cn("p-2 rounded-lg flex items-center justify-center transition-colors group-hover:scale-110", style.iconBg, style.color)}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{style.label}</h3>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Drag to phase</p>
      </div>
      <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors">
        <GripVertical size={16} />
      </div>
    </div>
  );
}

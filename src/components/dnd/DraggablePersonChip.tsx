import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { TeamMember } from '@/lib/firebase/schema';
import { cn, getInitials } from '@/lib/utils';

interface DraggablePersonChipProps {
  member: TeamMember;
}

export function DraggablePersonChip({ member }: DraggablePersonChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `person-${member.id}`,
    data: {
      type: 'Person',
      member,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        isDragging && "opacity-50 ring-2 ring-blue-500 ring-offset-2 scale-95 shadow-sm"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          getInitials(member.name)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{member.name}</h3>
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">{member.role}</p>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
            ${member.costPerHour.toLocaleString(undefined, { maximumFractionDigits: 0 })}/h
          </span>
        </div>
      </div>
      <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors">
        <GripVertical size={16} />
      </div>
    </div>
  );
}

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { TeamMember } from '@/lib/firebase/schema';
import { cn, getInitials } from '@/lib/utils';
import { useAppSettings } from '@/lib/auth/AuthContext';

interface DraggablePersonChipProps {
  member: TeamMember;
}

export function DraggablePersonChip({ member }: DraggablePersonChipProps) {
  const { formatCurrency } = useAppSettings();
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
        "flex items-center gap-3 p-2.5 rounded-xl border bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 cursor-grab active:cursor-grabbing hover:border-accent-300 dark:hover:border-accent-700 transition-colors group",
        isDragging && "opacity-50 ring-2 ring-accent-500 ring-offset-2 scale-95 shadow-lg"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-ink-100 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 flex items-center justify-center text-ink-500 dark:text-ink-400 font-bold overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          getInitials(member.name)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-ink-800 dark:text-ink-200 truncate">{member.name}</h3>
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-medium text-ink-500 dark:text-ink-400 truncate">{member.role}</p>
          <span className="text-[10px] font-bold text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700 px-1.5 py-0.5 rounded">
            {formatCurrency(member.costPerHour, 0)}/h
          </span>
        </div>
      </div>
      <div className="text-ink-300 dark:text-ink-600 group-hover:text-ink-400 dark:group-hover:text-ink-400 transition-colors">
        <GripVertical size={16} />
      </div>
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentBlock, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Project } from '@/lib/firebase/schema';
import { GripVertical, Trash2 } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface SortableBlockProps {
  block: DocumentBlock;
  phases: Phase[];
  allocations: Allocation[];
  costs: ProjectCost[];
  members: TeamMember[];
  categories: TeamCategory[];
  project: Project;
  onUpdate: (content: string, title: string) => void;
  onDelete: () => void;
}

export function SortableBlock({ block, phases, allocations, costs, members, categories, project, onUpdate, onDelete }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const [title, setTitle] = useState(block.title);
  
  // Tiptap editor for rich text
  const editor = useEditor({
    extensions: [StarterKit],
    content: block.content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML(), title);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[100px]',
      },
    },
  });

  const handleTitleBlur = () => {
    onUpdate(block.content, title);
  };

  const renderContent = () => {
    if (block.type === 'rich_text') {
      return (
        <div className="prose-wrapper">
          <EditorContent editor={editor} />
        </div>
      );
    }
    
    if (block.type === 'phase_scope') {
      return (
        <div className="space-y-6">
          {phases.map(phase => (
            <div key={phase.id} className="border-l-4 border-blue-500 pl-4 py-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{phase.name}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">{phase.durationWeeks} Weeks</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">{phase.description || 'No description provided.'}</p>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === 'financial_summary') {
      let totalProjectCost = 0;
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Phase</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {phases.map(phase => {
                let phaseCost = 0;
                allocations.filter(a => a.phaseId === phase.id).forEach(a => {
                  const m = members.find(m => m.id === a.memberId);
                  if (m) phaseCost += a.hours * m.costPerHour;
                });
                costs.filter(c => c.phaseId === phase.id).forEach(c => {
                  phaseCost += c.quantity * c.unitCost;
                });
                totalProjectCost += phaseCost;
                return (
                  <tr key={phase.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{phase.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{phase.durationWeeks} Weeks</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">${phaseCost.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 text-right">Total Cost</td>
                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 text-right">${totalProjectCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">Total Fee (incl. {project.profitMargin || 30}% Profit)</td>
                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">${(totalProjectCost * (1 + (project.profitMargin || 30)/100)).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
    
    
    if (block.type === 'team_breakdown') {
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Team Member</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold text-center">Allocated Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {members.map(member => {
                const memberAllocations = allocations.filter(a => a.memberId === member.id);
                if (memberAllocations.length === 0) return null;
                
                const totalHours = memberAllocations.reduce((sum, a) => sum + a.hours, 0);
                
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{member.position}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-800 dark:text-slate-200">{totalHours} hrs</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group relative bg-white dark:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:shadow-sm rounded-xl transition-all p-6 -mx-6"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-[-24px] top-6 p-1 text-slate-300 hover:text-slate-500 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
      >
        <GripVertical size={20} />
      </div>
      
      <div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
        <button onClick={onDelete} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <input 
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="text-2xl font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none mb-2 w-full focus:ring-2 focus:ring-blue-500/20 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors py-1 -ml-1 px-1"
        placeholder="Section Title"
      />
      
      {renderContent()}
    </div>
  );
}

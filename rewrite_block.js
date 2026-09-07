const fs = require('fs');

const blockCode = `
"use client";
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentBlock, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Project, Payment } from '@/lib/firebase/schema';
import { GripVertical, Trash2, FileText, Calculator, Users, CreditCard } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import StarterKit from '@tiptap/starter-kit';

interface SortableBlockProps {
  block: DocumentBlock;
  phases: Phase[];
  allocations: Allocation[];
  costs: ProjectCost[];
  members: TeamMember[];
  categories: TeamCategory[];
  payments: Payment[];
  project: Project;
  onUpdate: (content: string, title: string) => void;
  onDelete: () => void;
  onInsert: (type: DocumentBlock['type']) => void;
}

export function SortableBlock({ block, phases, allocations, costs, members, categories, payments, project, onUpdate, onDelete, onInsert }: SortableBlockProps) {
  const [title, setTitle] = useState(block.title);
  
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
    zIndex: isDragging ? 10 : 1,
  };

  const handleTitleBlur = () => {
    if (title !== block.title) {
      onUpdate(editor ? editor.getHTML() : block.content, title);
    }
  };

  const renderContent = () => {
    if (block.type === 'rich_text') {
      return (
        <div className="prose-wrapper relative group/editor">
          {editor && (
            <div className="opacity-0 group-hover/editor:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700 absolute -top-10 left-0 z-20 print:hidden">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><Bold size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><Italic size={14} /></button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><List size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><ListOrdered size={14} /></button>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      );
    }
    
    if (block.type === 'phase_scope') {
      return (
        <div className="space-y-4">
          {phases.map(phase => (
            <div key={phase.id} className="p-4 border-l-2 border-blue-500 bg-slate-50 dark:bg-slate-800/50 rounded-r-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{phase.name}</h4>
                <span className="text-sm text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">{phase.durationWeeks} Weeks</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{phase.description || "No description provided."}</p>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === 'financial_summary') {
      let totalProjectFee = 0;
      const profitMultiplier = 1 + ((project.profitMargin || 30) / 100);

      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Phase</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold text-right">Fee</th>
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
                
                const phaseFee = phaseCost * profitMultiplier;
                totalProjectFee += phaseFee;
                
                return (
                  <tr key={phase.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{phase.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{phase.durationWeeks} Weeks</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">$\\{phaseFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">Total Fee</td>
                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">$\\{totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
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
                const memberAllocations = allocations.filter(a => a.memberId === member.id && a.projectId === project.id);
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

    if (block.type === 'payment_schedule') {
      let totalProjectFee = 0;
      const profitMultiplier = 1 + ((project.profitMargin || 30) / 100);

      for (const phase of phases) {
        let phaseCost = 0;
        allocations.filter(a => a.phaseId === phase.id).forEach(a => {
          const m = members.find(m => m.id === a.memberId);
          if (m) phaseCost += a.hours * m.costPerHour;
        });
        costs.filter(c => c.phaseId === phase.id).forEach(c => {
          phaseCost += c.quantity * c.unitCost;
        });
        totalProjectFee += phaseCost * profitMultiplier;
      }

      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Milestone</th>
                <th className="px-4 py-3 font-bold text-center">%</th>
                <th className="px-4 py-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {payments.map(payment => {
                const amount = totalProjectFee * (payment.percentage / 100);
                return (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{payment.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{payment.percentage}%</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">$\\{amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">Total Fee</td>
                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">$\\{totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
          {payments.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-sm">No payment milestones found for this project. Add them in the Project Settings.</div>
          )}
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

      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 print:hidden flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Add</span>
        <button onClick={() => onInsert('rich_text')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Text"><FileText size={14} /></button>
        <button onClick={() => onInsert('financial_summary')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Financials"><Calculator size={14} /></button>
        <button onClick={() => onInsert('team_breakdown')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Team"><Users size={14} /></button>
        <button onClick={() => onInsert('payment_schedule')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Payments"><CreditCard size={14} /></button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/documents/SortableBlock.tsx', blockCode);

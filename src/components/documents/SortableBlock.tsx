
"use client";
import React, { useState } from 'react';
import { computeProjectFinancials, feeMultiplierFor } from '@/lib/utils/projectFinancials';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentBlock, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Project, Payment } from '@/lib/firebase/schema';
import { getAllocationRate } from '@/lib/utils/allocationCost';
import { GripVertical, Trash2, FileText, Calculator, Users, CreditCard, BookmarkPlus } from 'lucide-react';
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
  onSaveTemplate: (block: DocumentBlock, currentContent: string, currentTitle: string) => void;
}

export function SortableBlock({ block, phases, allocations, costs, members, categories, payments, project, onUpdate, onDelete, onInsert, onSaveTemplate }: SortableBlockProps) {
  const [title, setTitle] = useState(block.title);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: block.content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML(), title);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-ink dark:prose-invert max-w-none focus:outline-none min-h-[100px]',
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
            <div className="opacity-0 group-hover/editor:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 rounded-lg p-1 shadow-sm border border-ink-200 dark:border-ink-700 absolute -top-10 left-0 z-20 print:hidden">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 ${editor.isActive('bold') ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}`}
              ><Bold size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 ${editor.isActive('italic') ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}`}
              ><Italic size={14} /></button>
              <div className="w-px h-4 bg-ink-200 dark:bg-ink-700 mx-1"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 ${editor.isActive('bulletList') ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}`}
              ><List size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 ${editor.isActive('orderedList') ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}`}
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
            <div key={phase.id} className="p-4 border-l-2 border-accent-500 bg-ink-50 dark:bg-ink-800/50 rounded-r-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-ink-800 dark:text-ink-200">{phase.name}</h4>
                <span className="text-sm text-ink-500 bg-white dark:bg-ink-900 px-2 py-1 rounded shadow-sm border border-ink-200 dark:border-ink-700">{phase.durationWeeks} Weeks</span>
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-400 whitespace-pre-wrap">{phase.description || "No description provided."}</p>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === 'financial_summary') {
      let totalProjectFee = 0;
      const profitMultiplier = feeMultiplierFor(project, computeProjectFinancials(project, phases, allocations, costs, members).totalCost);

      return (
        <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300">
              <tr>
                <th className="px-4 py-3 font-bold">Phase</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200 dark:divide-ink-700">
              {phases.map(phase => {
                let phaseCost = 0;
                allocations.filter(a => a.phaseId === phase.id).forEach(a => {
                  const m = members.find(m => m.id === a.memberId);
                  if (m) phaseCost += a.hours * getAllocationRate(a, m);
                });
                costs.filter(c => c.phaseId === phase.id).forEach(c => {
                  phaseCost += c.quantity * c.unitCost;
                });
                
                const phaseFee = phaseCost * profitMultiplier;
                totalProjectFee += phaseFee;
                
                return (
                  <tr key={phase.id}>
                    <td className="px-4 py-3 font-medium text-ink-800 dark:text-ink-200">{phase.name}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-400">{phase.durationWeeks} Weeks</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-800 dark:text-ink-200">${phaseFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-ink-50 dark:bg-ink-900 border-t-2 border-ink-200 dark:border-ink-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-accent-600 dark:text-accent-400 text-right">Total fee</td>
                <td className="px-4 py-3 font-bold text-accent-600 dark:text-accent-400 text-right">${totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (block.type === 'team_breakdown') {
      return (
        <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300">
              <tr>
                <th className="px-4 py-3 font-bold">Team member</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold text-center">Allocated hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200 dark:divide-ink-700">
              {members.map(member => {
                const memberAllocations = allocations.filter(a => a.memberId === member.id && a.projectId === project.id);
                if (memberAllocations.length === 0) return null;
                
                const totalHours = memberAllocations.reduce((sum, a) => sum + a.hours, 0);
                
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-ink-800 dark:text-ink-200 flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-[10px] font-bold">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-400">{member.position}</td>
                    <td className="px-4 py-3 text-center font-medium text-ink-800 dark:text-ink-200">{totalHours} hrs</td>
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
      const profitMultiplier = feeMultiplierFor(project, computeProjectFinancials(project, phases, allocations, costs, members).totalCost);

      for (const phase of phases) {
        let phaseCost = 0;
        allocations.filter(a => a.phaseId === phase.id).forEach(a => {
          const m = members.find(m => m.id === a.memberId);
          if (m) phaseCost += a.hours * getAllocationRate(a, m);
        });
        costs.filter(c => c.phaseId === phase.id).forEach(c => {
          phaseCost += c.quantity * c.unitCost;
        });
        totalProjectFee += phaseCost * profitMultiplier;
      }

      return (
        <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300">
              <tr>
                <th className="px-4 py-3 font-bold">Milestone</th>
                <th className="px-4 py-3 font-bold text-center">%</th>
                <th className="px-4 py-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200 dark:divide-ink-700">
              {payments.map(payment => {
                const amount = totalProjectFee * (payment.percentage / 100);
                return (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-medium text-ink-800 dark:text-ink-200">{payment.name}</td>
                    <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400">{payment.percentage}%</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-800 dark:text-ink-200">${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-ink-50 dark:bg-ink-900 border-t-2 border-ink-200 dark:border-ink-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-accent-600 dark:text-accent-400 text-right">Total fee</td>
                <td className="px-4 py-3 font-bold text-accent-600 dark:text-accent-400 text-right">${totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
          {payments.length === 0 && (
            <div className="p-4 text-center text-ink-500 text-sm">No payment milestones found for this project. Add them in the Project Settings.</div>
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
      className="group relative bg-white dark:bg-ink-900 border border-transparent hover:border-ink-100 dark:hover:border-ink-800 hover:shadow-sm rounded-xl transition-all p-6 -mx-6"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-[-24px] top-6 p-1 text-ink-300 hover:text-ink-500 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
      >
        <GripVertical size={20} />
      </div>
      
      <div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex gap-1">
        <button onClick={() => onSaveTemplate(block, editor ? editor.getHTML() : block.content, title)} className="p-1.5 text-accent-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-md transition-colors" title="Save as Template">
          <BookmarkPlus size={16} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-negative-400 hover:text-negative-600 hover:bg-negative-50 dark:hover:bg-negative-900/30 rounded-md transition-colors" title="Delete Block">
          <Trash2 size={16} />
        </button>
      </div>

      <input 
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="text-2xl font-bold text-ink-800 dark:text-ink-200 bg-transparent border-none outline-none mb-2 w-full focus:ring-2 focus:ring-accent-500/20 rounded hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors py-1 -ml-1 px-1"
        placeholder="Section Title"
      />
      
      {renderContent()}

      <div className="absolute -bottom-6 left-0 right-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity z-50 print:hidden cursor-default">
        <div className="flex items-center gap-1 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 shadow-md rounded-full px-2 py-1">
          <span className="text-xs font-medium text-ink-500 mr-1">Add</span>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('rich_text'); }} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded text-ink-600 dark:text-ink-300 transition-colors" title="Add Text"><FileText size={14} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('financial_summary'); }} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded text-ink-600 dark:text-ink-300 transition-colors" title="Add Financials"><Calculator size={14} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('team_breakdown'); }} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded text-ink-600 dark:text-ink-300 transition-colors" title="Add Team"><Users size={14} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert('payment_schedule'); }} className="p-1 hover:bg-ink-100 dark:hover:bg-ink-700 rounded text-ink-600 dark:text-ink-300 transition-colors" title="Add Payments"><CreditCard size={14} /></button>
        </div>
      </div>
    </div>
  );
}

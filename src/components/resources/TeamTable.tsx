import React, { useState, useMemo } from 'react';
import { TeamMember } from '@/lib/firebase/schema';
import { Pencil, Trash2, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { getCategoryOrder } from '@/lib/utils';

interface TeamTableProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export function TeamTable({ members, onEdit, onDelete, onBulkDelete }: TeamTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const membersByCategory = useMemo(() => {
    const groups: Record<string, TeamMember[]> = {};
    members.forEach(m => {
      const cat = m.category || 'UNCATEGORIZED';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [members]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: prev[cat] === undefined ? false : !prev[cat]
    }));
  };

  const isExpanded = (cat: string) => expandedCategories[cat] !== false;

  const toggleSelectGroup = (cat: string) => {
    const catMembers = membersByCategory[cat] || [];
    const allSelected = catMembers.every(m => selectedIds.has(m.id!));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      catMembers.forEach(m => newSet.delete(m.id!));
    } else {
      catMembers.forEach(m => newSet.add(m.id!));
    }
    setSelectedIds(newSet);
  };

  if (members.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
        <p>No team members found.</p>
        <p className="text-sm">Click &quot;Add Member&quot; to create one, or run the seed script.</p>
      </div>
    );
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id!)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-3 flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50 shrink-0">
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">{selectedIds.size} member{selectedIds.size > 1 ? 's' : ''} selected</span>
          <button 
            onClick={handleBulkDelete}
            className="text-sm font-medium bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} /> Delete Selected
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === members.length && members.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Name</th>
              <th className="px-4 py-3 font-semibold">Position</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Salary/Mo</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Overheads/Mo</th>
              <th className="px-4 py-3 font-semibold text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">Cost/Hr</th>
              <th className="px-4 py-3 font-semibold text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Fee/Hr</th>
              <th className="px-4 py-3 font-semibold text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Object.entries(membersByCategory)
              .sort(([catA], [catB]) => getCategoryOrder(catA) - getCategoryOrder(catB))
              .map(([category, catMembers]) => {
              const allSelected = catMembers.every(m => selectedIds.has(m.id!));
              const someSelected = catMembers.some(m => selectedIds.has(m.id!)) && !allSelected;
              
              return (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group" onClick={() => toggleCategory(category)}>
                    <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={() => toggleSelectGroup(category)}
                        className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td colSpan={8} className="px-4 py-2">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                        {isExpanded(category) ? <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400" /> : <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400" />}
                        <Folder size={16} className="text-blue-500 dark:text-blue-400" />
                        {category} ({catMembers.length})
                      </div>
                    </td>
                  </tr>

                  {/* Members */}
                  {isExpanded(category) && catMembers.map(member => (
                    <tr key={member.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group/row ${selectedIds.has(member.id!) ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(member.id!)}
                          onChange={() => toggleSelect(member.id!)}
                          className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap pl-6">{member.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{member.position}</td>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">-</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                          member.type.toLowerCase() === 'employee' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {member.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">${member.salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">${member.overheads.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">${member.costPerHour.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">${member.roundedFeeHour.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onEdit(member)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => member.id && onDelete(member.id)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

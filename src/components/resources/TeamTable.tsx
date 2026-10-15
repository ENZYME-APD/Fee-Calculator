import React, { useState, useMemo } from 'react';
import { TeamMember, TeamCategory } from '@/lib/firebase/schema';
import { Pencil, Trash2, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Edit3 } from 'lucide-react';
import { getCategories } from '@/lib/firebase/db';
import { useAppSettings } from '@/lib/auth/AuthContext';
import { BulkEditTeamModal } from './BulkEditTeamModal';
import { Tooltip } from '@/components/ui/Tooltip';
import { SecondaryButton, IconButton } from '@/components/ui/Button';

interface TeamTableProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkEdit?: (ids: string[], updates: Partial<TeamMember>) => void;
}

export function TeamTable({ members, onEdit, onDelete, onBulkDelete, onBulkEdit }: TeamTableProps) {
  const { formatCurrency, currencyCode } = useAppSettings();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [categories, setCategories] = useState<TeamCategory[]>([]);

  React.useEffect(() => {
    getCategories().then(setCategories);
  }, []);

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

  const allExpanded = Object.keys(membersByCategory).every(cat => isExpanded(cat));

  const setAllFolders = (expanded: boolean) => {
    const newState: Record<string, boolean> = {};
    Object.keys(membersByCategory).forEach(cat => { newState[cat] = expanded; });
    setExpandedCategories(newState);
  };

  const toggleAllFolders = () => setAllFolders(!allExpanded);

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
      <div className="flex-1 flex flex-col items-center justify-center text-ink-500 dark:text-ink-400 p-8">
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

  const handleBulkEditSave = (updates: Partial<TeamMember>) => {
    if (onBulkEdit && selectedIds.size > 0 && Object.keys(updates).length > 0) {
      onBulkEdit(Array.from(selectedIds), updates);
    }
    setIsBulkEditOpen(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-accent-50 dark:bg-accent-900/30 px-6 py-3 flex items-center justify-between border-b border-accent-100 dark:border-accent-900/50 shrink-0">
          <span className="text-sm font-semibold text-accent-800 dark:text-accent-300">{selectedIds.size} member{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={() => setIsBulkEditOpen(true)}>
              <Edit3 size={14} /> Edit Selected
            </SecondaryButton>
            <SecondaryButton onClick={handleBulkDelete} className="text-negative-600 dark:text-negative-400 hover:bg-negative-50 dark:hover:bg-negative-900/30 border-negative-200 dark:border-negative-900/50">
              <Trash2 size={14} /> Delete Selected
            </SecondaryButton>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-ink-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 dark:bg-ink-900 text-ink-500 dark:text-ink-400 sticky top-0 border-b border-ink-200 dark:border-ink-800 z-10">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <Tooltip content="Select All" position="top">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === members.length && members.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-800 text-accent-600 focus:ring-accent-500 cursor-pointer"
                  />
                </Tooltip>
              </th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Tooltip content={allExpanded ? 'Collapse all groups (or ⌥-click a group)' : 'Expand all groups (or ⌥-click a group)'} position="top">
                    <button 
                      onClick={toggleAllFolders} 
                      aria-label={allExpanded ? 'Collapse all groups' : 'Expand all groups'}
                      className="p-1 hover:bg-ink-200 dark:hover:bg-ink-700 rounded transition-colors text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-300"
                    >
                      {allExpanded ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
                    </button>
                  </Tooltip>
                  Name
                </div>
              </th>
              <th className="px-4 py-3 font-semibold">Position</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Salary/mo ({currencyCode})</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Overheads/mo ({currencyCode})</th>
              <th className="px-4 py-3 font-semibold text-right text-negative-600 dark:text-negative-400 whitespace-nowrap">Cost/hr ({currencyCode})</th>
              <th className="px-4 py-3 font-semibold text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {Object.entries(membersByCategory)
              .sort(([catA], [catB]) => {
                const orderA = categories.find(c => c.id === catA)?.order ?? 99;
                const orderB = categories.find(c => c.id === catB)?.order ?? 99;
                return orderA - orderB;
              })
              .map(([category, catMembers]) => {
              const allSelected = catMembers.every(m => selectedIds.has(m.id!));
              const someSelected = catMembers.some(m => selectedIds.has(m.id!)) && !allSelected;
              
              return (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-ink-100/50 dark:bg-ink-800/50 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors cursor-pointer group" onClick={(e) => e.altKey ? setAllFolders(!isExpanded(category)) : toggleCategory(category)}>
                    <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={() => toggleSelectGroup(category)}
                        className="rounded border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-800 text-accent-600 focus:ring-accent-500 cursor-pointer"
                      />
                    </td>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isExpanded(category) ? <ChevronDown size={16} className="text-ink-500 dark:text-ink-400 group-hover:text-ink-600 dark:group-hover:text-ink-400" /> : <ChevronRight size={16} className="text-ink-500 dark:text-ink-400 group-hover:text-ink-600 dark:group-hover:text-ink-400" />}
                        <span className="font-bold text-ink-800 dark:text-ink-200">
                          {categories.find(c => c.id === category)?.name || 'Uncategorized'}
                        </span>
                        {categories.find(c => c.id === category)?.type === 'external' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-negative-100 text-negative-700 dark:bg-negative-900/50 dark:text-negative-400">
                            EXTERNAL
                          </span>
                        )}
                        <span className="text-ink-500 dark:text-ink-400 font-medium">({catMembers.length})</span>
                      </div>
                    </td>
                  </tr>

                  {/* Members */}
                  {isExpanded(category) && catMembers.map(member => (
                    <tr key={member.id} className={`hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors group/row ${selectedIds.has(member.id!) ? 'bg-accent-50/30 dark:bg-accent-900/20' : ''}`}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(member.id!)}
                          onChange={() => toggleSelect(member.id!)}
                          className="rounded border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-800 text-accent-600 focus:ring-accent-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-ink-900 dark:text-ink-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                            {member.name}
                          </span>
                          <span className="text-xs text-ink-500 dark:text-ink-400 font-medium">
                            {member.position}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600 dark:text-ink-400">{member.position}</td>
                      <td className="px-4 py-3 text-right text-ink-600 dark:text-ink-400">{formatCurrency(member.salary)}</td>
                      <td className="px-4 py-3 text-right text-ink-600 dark:text-ink-400">{formatCurrency(member.overheads)}</td>
                      <td className="px-4 py-3 text-right font-medium text-negative-600 dark:text-negative-400">{formatCurrency(member.costPerHour)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip content="Edit" position="top">
                            <button 
                              onClick={() => onEdit(member)}
                              className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete" position="top">
                            <button 
                              onClick={() => member.id && onDelete(member.id)}
                              className="p-1.5 text-ink-500 dark:text-ink-400 hover:text-negative-600 dark:hover:text-negative-400 hover:bg-negative-50 dark:hover:bg-negative-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
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

      <BulkEditTeamModal 
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEditSave}
        selectedCount={selectedIds.size}
        categories={categories}
      />
    </div>
  );
}

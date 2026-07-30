/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useState } from 'react';
import { getTeamMembers, deleteTeamMember, batchUpdateTeamMembers } from '@/lib/firebase/db';
import { TeamMember } from '@/lib/firebase/schema';
import { TeamTable } from '@/components/resources/TeamTable';
import { TeamMemberForm } from '@/components/resources/TeamMemberForm';
import { CsvManager } from '@/components/resources/CsvManager';
import { Plus } from 'lucide-react';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      await deleteTeamMember(id);
      loadMembers();
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`Are you sure you want to delete ${ids.length} team members?`)) {
      setLoading(true);
      await Promise.all(ids.map(id => deleteTeamMember(id)));
      loadMembers();
    }
  };

  const handleBulkEdit = async (ids: string[], updates: Partial<TeamMember>) => {
    setLoading(true);
    const fullUpdates = ids.map(id => {
      const member = members.find(m => m.id === id);
      if (!member) return { id, data: updates };
      
      const newSalary = updates.salary !== undefined ? updates.salary : member.salary;
      const newOverheads = updates.overheads !== undefined ? updates.overheads : member.overheads;
      
      let derived = {};
      if (updates.salary !== undefined || updates.overheads !== undefined) {
        const baseCost = (newSalary + newOverheads) / 160;
        derived = {
          costPerHour: parseFloat(baseCost.toFixed(2)),
          roundedFeeHour: parseFloat((baseCost * 2.5).toFixed(2))
        };
      }
      
      return {
        id,
        data: { ...updates, ...derived }
      };
    });

    await batchUpdateTeamMembers(fullUpdates);
    loadMembers();
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="p-8 max-w-6xl w-full mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Team Resources</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage team members, salaries, and rates.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvManager onComplete={loadMembers} />
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Member
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">Loading resources...</div>
        ) : (
          <TeamTable members={members} onEdit={handleEdit} onDelete={handleDelete} onBulkDelete={handleBulkDelete} onBulkEdit={handleBulkEdit} />
        )}
      </div>

      <TeamMemberForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={loadMembers}
        initialData={editingMember}
      />
    </div>
  );
}

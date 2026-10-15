/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useState } from 'react';
import { getTeamMembers, deleteTeamMember, batchUpdateTeamMembers } from '@/lib/firebase/db';
import { TeamMember } from '@/lib/firebase/schema';
import { TeamTable } from '@/components/resources/TeamTable';
import { TeamMemberForm } from '@/components/resources/TeamMemberForm';
import { CsvManager } from '@/components/resources/CsvManager';
import { Plus, Settings } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';

export default function TeamPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const isSuperadmin = user?.email?.toLowerCase().endsWith('@weareenzyme.com');
  const isAdmin = dbUser?.role === 'admin' || isSuperadmin;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
    if (!authLoading && !isAdmin) {
      router.replace('/overview');
      return;
    }
    if (!authLoading && isAdmin) {
      loadMembers();
    }
  }, [authLoading, isAdmin]);

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this team member? This action cannot be undone.',
      confirmText: 'Remove',
      onConfirm: async () => {
        await deleteTeamMember(id);
        loadMembers();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Team Members',
      message: `Are you sure you want to delete ${ids.length} team members? This action cannot be undone.`,
      confirmText: 'Delete All',
      onConfirm: async () => {
        setLoading(true);
        await Promise.all(ids.map(id => deleteTeamMember(id)));
        loadMembers();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
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

  if (authLoading || (!isAdmin)) {
    return (
      <div className="flex h-full items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl w-full mx-auto flex flex-col h-full gap-5">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-ink-900 dark:text-ink-50 tracking-tight">Team resources</h1>
          <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-0.5">Manage team members, salaries, and rates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings?tab=categories">
            <SecondaryButton>
              <Settings size={14} />
              Categories
            </SecondaryButton>
          </Link>
          <CsvManager onComplete={loadMembers} />
          <PrimaryButton onClick={handleAddNew}>
            <Plus size={15} />
            Add Member
          </PrimaryButton>
        </div>
      </div>

      <Card className="flex-1 min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-ink-500">Loading resources...</div>
        ) : (
          <CardBody className="flex flex-col overflow-hidden">
            <TeamTable members={members} onEdit={handleEdit} onDelete={handleDelete} onBulkDelete={handleBulkDelete} onBulkEdit={handleBulkEdit} />
          </CardBody>
        )}
      </Card>

      <TeamMemberForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={loadMembers}
        initialData={editingMember}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, addProject, updateProject, deleteProject, getPhases, addPhase, updatePhase, deletePhase, duplicateProject, clearPhase, getUsersByCompany, getProjectCosts, getAllocations, getTeamMembers, updateAllocation } from '@/lib/firebase/db';
import { Project, Phase, User, Allocation, ProjectCost, TeamMember } from '@/lib/firebase/schema';
import { Folder, Plus, Trash2, Clock, Pencil, X, Check, Copy, Eraser, Calculator, ChevronUp, ChevronDown, Save, Search, CalendarDays, MoreVertical } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { PaymentScheduleManager } from './PaymentScheduleManager';
import { useAuth, useAppSettings } from '@/lib/auth/AuthContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { PromptModal } from '@/components/modals/PromptModal';
import { PhaseSettingsModal } from '@/components/modals/PhaseSettingsModal';
import { Card, CardHeader, CardBody, Row } from '@/components/ui/Card';
import { PrimaryButton, IconButton, fieldClass } from '@/components/ui/Button';
import { StatusBadge, getStatusConfig } from '@/components/ui/StatusBadge';
import { ProjectFinancialHeader } from '@/components/layout/ProjectFinancialHeader';
import { computeProjectFinancials } from '@/lib/utils/projectFinancials';

export function ProjectManager({ isTemplateMode = false }: { isTemplateMode?: boolean }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Draft', 'Proposed', 'Active']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  
  // Edit Project
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectStatus, setEditingProjectStatus] = useState('Draft');
  const [editingProjectStartDate, setEditingProjectStartDate] = useState(Date.now());
  const [editingProjectOwnerId, setEditingProjectOwnerId] = useState('');
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  
  // New Phase Form
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDuration, setNewPhaseDuration] = useState('');
  
  // Edit Phase
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [settingsPhaseId, setSettingsPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState('');
  const [editingPhaseDuration, setEditingPhaseDuration] = useState('');
  
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingPhase, setIsSavingPhase] = useState(false);

  // Overflow ("more actions") menus for project/phase rows — collapses the
  // less-frequent actions behind one button instead of 4-5 always-reserved
  // hover icons per row.
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);
  const [openPhaseMenuId, setOpenPhaseMenuId] = useState<string | null>(null);

  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    confirmText: string;
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    confirmText: '',
    onConfirm: () => {}
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    secondaryAction?: {
      text: string;
      onClick: () => void;
    };
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const { dbUser } = useAuth();
  const { formatCurrency, areaUnit } = useAppSettings();

  const loadProjects = async () => {
    const ownerId = dbUser?.role !== 'admin' ? dbUser?.uid : undefined;
    const data = await getProjects(isTemplateMode, ownerId);
    setProjects(data);
    if (data.length > 0 && !activeProjectId) {
      setActiveProjectId(data[0].id!);
    }
    if (!isTemplateMode) {
      const templateData = await getProjects(true);
      setTemplates(templateData);
    }
    setLoading(false);
  };

  const loadPhases = async (projectId: string) => {
    const data = await getPhases(projectId);
    const sortedPhases = data.sort((a, b) => a.order - b.order);
    setPhases(sortedPhases);
    
    const phaseIds = sortedPhases.map(p => p.id);
    const pAllocations = await getAllocations();
    const pCosts = await getProjectCosts(projectId);
    const pMembers = await getTeamMembers();
    
    // Use the robust phaseId filtering method instead of projectId due to legacy DB mapping bug
    setAllocations(pAllocations.filter(a => phaseIds.includes(a.phaseId)));
    setProjectCosts(pCosts.filter(c => phaseIds.includes(c.phaseId)));
    setTeamMembers(pMembers);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      loadPhases(activeProjectId);
    } else {
      setPhases([]);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (dbUser) {
      getUsersByCompany().then(setCompanyUsers);
    }
  }, [dbUser]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || isSavingProject) return;
    
    setIsSavingProject(true);
    try {
      if (!isTemplateMode && selectedTemplateId) {
        const id = await duplicateProject(selectedTemplateId, true, newProjectName, false);
        setNewProjectName('');
        setSelectedTemplateId('');
        await loadProjects();
        setActiveProjectId(id);
      } else {
        const id = await addProject({ name: newProjectName, description: '', createdAt: Date.now(), isTemplate: isTemplateMode });
        setNewProjectName('');
        await loadProjects();
        setActiveProjectId(id);
      }
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      confirmText: 'Delete Project',
      onConfirm: async () => {
        await deleteProject(id);
        if (activeProjectId === id) setActiveProjectId(null);
        loadProjects();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const performDuplicate = async (includeAllocations: boolean) => {
      try {
        const newProjectId = await duplicateProject(id, includeAllocations);
        await loadProjects();
        setActiveProjectId(newProjectId);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error("Failed to duplicate project:", error);
        alert("Failed to duplicate project");
      }
    };
    
    setConfirmConfig({
      isOpen: true,
      title: 'Duplicate Project',
      message: 'Do you want to duplicate this project exactly as is? You can keep all team members and project costs, or create a clean template with empty phases.',
      confirmText: 'Keep All',
      onConfirm: () => performDuplicate(true),
      secondaryAction: {
        text: 'Clean Template',
        onClick: () => performDuplicate(false)
      }
    });
  };

  const handleSaveAsTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    
    setPromptConfig({
      isOpen: true,
      title: 'Save as Template',
      message: 'Enter a name for this template:',
      defaultValue: `${p.name} Template`,
      confirmText: 'Save Template',
      onConfirm: async (name: string) => {
        if (name.trim()) {
          const finalName = name.trim();
          const existing = templates.find(t => t.name.toLowerCase() === finalName.toLowerCase());
          
          if (existing) {
            setPromptConfig(prev => ({ ...prev, isOpen: false }));
            setConfirmConfig({
              isOpen: true,
              title: 'Template Already Exists',
              message: `A template named "${finalName}" already exists. Do you want to overwrite it, or save this as a copy?`,
              confirmText: 'Overwrite',
              onConfirm: async () => {
                try {
                  await deleteProject(existing.id!);
                  await duplicateProject(id, true, finalName, true);
                  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template overwritten successfully!' } }));
                  await loadProjects();
                } catch(err) {
                  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to overwrite template.' } }));
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
              },
              secondaryAction: {
                text: 'Save as Copy',
                onClick: async () => {
                  try {
                    await duplicateProject(id, true, `${finalName} (Copy)`, true);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template copy saved successfully!' } }));
                    await loadProjects();
                  } catch(err) {
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to save template.' } }));
                  }
                  setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
              }
            });
            return;
          }

          try {
            await duplicateProject(id, true, finalName, true);
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Saved as template successfully!' } }));
            await loadProjects();
          } catch(err) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to save template.' } }));
          }
        }
        setPromptConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditProjectStart = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(p.id!);
    setEditingProjectName(p.name);
    setEditingProjectStatus(p.status || 'Draft');
    setEditingProjectStartDate(p.startDate || Date.now());
    setEditingProjectOwnerId(p.ownerId || dbUser?.uid || '');
  };

  const handleEditProjectSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProjectId && editingProjectName.trim()) {
      await updateProject(editingProjectId, { 
        name: editingProjectName.trim(),
        status: editingProjectStatus,
        startDate: editingProjectStartDate,
        ownerId: editingProjectOwnerId
      });
      await loadProjects();
    }
    setEditingProjectId(null);
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim() || !activeProjectId || isSavingPhase) return;
    
    setIsSavingPhase(true);
    try {
      await addPhase({
        projectId: activeProjectId,
        name: newPhaseName,
        description: '',
        durationWeeks: parseFloat(newPhaseDuration) || 1,
        order: phases.length + 1
      });
      setNewPhaseName('');
      setNewPhaseDuration('');
      await loadPhases(activeProjectId);
    } finally {
      setIsSavingPhase(false);
    }
  };

  
  const handleSavePhaseSettings = async (id: string, updates: Partial<Phase>) => {
    await updatePhase(id, updates);
    await loadPhases(activeProjectId!);
  };

  const handleEditPhaseStart = (p: Phase) => {
    setEditingPhaseId(p.id!);
    setEditingPhaseName(p.name);
    setEditingPhaseDuration(p.durationWeeks.toString());
  };

  const handleEditPhaseSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPhaseId && editingPhaseName.trim()) {
      await updatePhase(editingPhaseId, { 
        name: editingPhaseName.trim(),
        durationWeeks: parseFloat(editingPhaseDuration) || 1
      });
      await loadPhases(activeProjectId!);
    }
    setEditingPhaseId(null);
  };

  const handleDeletePhase = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Phase',
      message: 'Are you sure you want to delete this phase entirely? All associated costs and resources will be lost.',
      confirmText: 'Delete Phase',
      onConfirm: async () => {
        await deletePhase(id);
        // Fix orders for remaining
        const remaining = phases.filter(p => p.id !== id);
        await Promise.all(remaining.map((p, i) => updatePhase(p.id!, { order: i + 1 })));
        loadPhases(activeProjectId!);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleClearPhase = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear Phase',
      message: 'Are you sure you want to clear all team members and costs from this phase?',
      confirmText: 'Clear Phase',
      onConfirm: async () => {
        await clearPhase(id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleMovePhase = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === phases.length - 1) return;

    const newPhases = [...phases];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newPhases[index];
    newPhases[index] = newPhases[targetIndex];
    newPhases[targetIndex] = temp;
    
    // Update orders for all to ensure consistency
    newPhases.forEach((p, i) => { p.order = i + 1; });

    // Optimistic update
    setPhases([...newPhases]);

    // DB update for all to fix any gaps
    await Promise.all(newPhases.map(p => updatePhase(p.id!, { order: p.order })));
  };

  if (loading) return <div className="p-8 text-slate-500">Loading projects...</div>;

  const activeProject = projects.find(p => p.id === activeProjectId);
  const { totalCost, profitMarginPercent, totalFee } = computeProjectFinancials(activeProject, phases, allocations, projectCosts, teamMembers);

  const sortedProjects = [...projects]
    .filter(p => isTemplateMode || selectedStatuses.includes(p.status || 'Draft'))
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = (a.createdAt || 0) - (b.createdAt || 0);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="flex flex-col h-full gap-5 mx-auto w-full p-8" style={{ maxWidth: '1600px' }}>
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {isTemplateMode ? 'Project Templates' : 'Projects & Phases'}
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isTemplateMode ? 'Manage reusable project structures.' : 'Manage projects, phases, and payment milestones.'}
          </p>
        </div>
      </div>

      {activeProject && !isTemplateMode && (
        <ProjectFinancialHeader
          left={
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/dashboard?project=${activeProject.id}`)}
                className="font-bold text-base text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left flex items-center gap-1.5 group"
                title="Open Fee Proposal"
              >
                {activeProject.name}
                <Calculator size={15} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
              </button>
              <StatusBadge status={activeProject.status || 'Draft'} />
              {activeProject.area && <span className="text-xs text-slate-400">· {activeProject.area} {areaUnit}</span>}
            </div>
          }
          totalCost={totalCost}
          profitMarginPercent={profitMarginPercent}
          totalFee={totalFee}
          formatCurrency={formatCurrency}
        />
      )}

      <div className="flex gap-5 flex-1 min-h-0 overflow-hidden">
        {/* Projects List */}
        <Card className="flex-1">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{isTemplateMode ? 'Templates' : 'Projects'}</h2>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as 'date' | 'name' | 'status');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-md text-[11px] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                {!isTemplateMode && (
                  <>
                    <option value="status-asc">Status (A-Z)</option>
                    <option value="status-desc">Status (Z-A)</option>
                  </>
                )}
              </select>
            </div>
            {!isTemplateMode && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.keys(STATUS_FILTERS).map(id => {
                  const cfg = getStatusConfig(id);
                  const isActive = selectedStatuses.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleStatusFilter(id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        isActive
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          : 'border-transparent text-slate-400 dark:text-slate-600 hover:text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${!isActive && 'opacity-40'}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <form onSubmit={handleCreateProject} className="flex flex-col gap-2">
              {!isTemplateMode && templates.length > 0 && (
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className={fieldClass + ' w-full'}
                >
                  <option value="">No Template</option>
                  <optgroup label="Templates">
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                </select>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isTemplateMode ? "New template name..." : "New project name..."}
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className={fieldClass + ' w-full'}
                />
                <PrimaryButton type="submit" disabled={isSavingProject}>
                  {isSavingProject ? 'Saving...' : <><Plus size={15} /> Add</>}
                </PrimaryButton>
              </div>
            </form>
          </div>

          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={isTemplateMode ? "Search templates..." : "Search projects..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <IconButton onClick={() => setSearchQuery('')}>
                <X size={13} />
              </IconButton>
            )}
          </div>

          <CardBody className="overflow-y-auto">
            {sortedProjects.map(p => {
              if (editingProjectId === p.id) {
                return (
                  <div key={p.id} className="p-3 border-b border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
                    <form onSubmit={handleEditProjectSave} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={editingProjectName}
                          onChange={e => setEditingProjectName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border-b border-blue-400 dark:border-blue-600 focus:outline-none font-semibold text-blue-900 dark:text-blue-300 bg-transparent"
                        />
                        <IconButton type="button" onClick={() => setEditingProjectId(null)}><X size={14} /></IconButton>
                        <IconButton type="submit" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"><Check size={14} /></IconButton>
                      </div>
                      {!isTemplateMode && (
                        <div className="flex gap-2 items-center text-xs">
                          <select
                            value={editingProjectStatus}
                            onChange={e => setEditingProjectStatus(e.target.value)}
                            className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Proposed">Proposed</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Lost">Lost/Archived</option>
                          </select>
                          <input
                            type="date"
                            value={new Date(editingProjectStartDate).toISOString().split('T')[0]}
                            onChange={e => setEditingProjectStartDate(new Date(e.target.value).getTime())}
                            className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          />
                          <select
                            value={editingProjectOwnerId}
                            onChange={e => setEditingProjectOwnerId(e.target.value)}
                            className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-28 truncate"
                          >
                            <option value="">No Originator</option>
                            {companyUsers.map(u => (
                              <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </form>
                  </div>
                );
              }

              return (
                <Row key={p.id} onClick={() => setActiveProjectId(p.id!)} active={activeProjectId === p.id}>
                  <Folder size={16} className={`shrink-0 ${activeProjectId === p.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${activeProjectId === p.id ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{p.name}</div>
                    {!isTemplateMode && <StatusBadge status={p.status || 'Draft'} className="mt-0.5" />}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
                    {!isTemplateMode && (
                      <Tooltip content="Open Fee Proposal">
                        <IconButton onClick={(e) => { e.stopPropagation(); router.push(`/dashboard?project=${p.id}`); }} className="hover:text-blue-600 dark:hover:text-blue-400">
                          <Calculator size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton onClick={(e) => { e.stopPropagation(); setOpenProjectMenuId(openProjectMenuId === p.id ? null : p.id!); }}>
                      <MoreVertical size={14} />
                    </IconButton>
                    {openProjectMenuId === p.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenProjectMenuId(null); }} />
                        <div className="absolute right-0 top-8 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                          <button onClick={(e) => { setOpenProjectMenuId(null); p.id && handleDuplicateProject(p.id, e); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                            <Copy size={14} /> {isTemplateMode ? 'Duplicate Template' : 'Duplicate Project'}
                          </button>
                          {!isTemplateMode && (
                            <button onClick={(e) => { setOpenProjectMenuId(null); p.id && handleSaveAsTemplate(p.id, e); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                              <Save size={14} /> Save as Template
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setOpenProjectMenuId(null); router.push('/planning?project=' + p.id); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                            <CalendarDays size={14} /> Project Planning
                          </button>
                          <button onClick={(e) => { setOpenProjectMenuId(null); handleEditProjectStart(p, e); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                            <Pencil size={14} /> Edit Name
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                          <button onClick={(e) => { setOpenProjectMenuId(null); p.id && handleDeleteProject(p.id, e); }} className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </Row>
              );
            })}
            {projects.length === 0 && <div className="text-slate-400 text-center py-8 text-sm">No projects created yet.</div>}
            {projects.length > 0 && sortedProjects.length === 0 && <div className="text-slate-400 text-center py-8 text-sm">No projects matching "{searchQuery}".</div>}
          </CardBody>
        </Card>

        {/* Phases Manager */}
        <Card className="flex-[1.3]">
          {activeProjectId ? (
            <>
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Phases</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{phases.length} phase{phases.length === 1 ? '' : 's'} · {phases.reduce((s, p) => s + p.durationWeeks, 0)} weeks total</p>
              </CardHeader>
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <form onSubmit={handleCreatePhase} className="flex gap-2 items-center">
                  <input type="text" required value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="Phase name, e.g. Schematic Design" className={fieldClass + ' flex-1 min-w-0'} />
                  <input type="number" required min="0.5" step="0.5" value={newPhaseDuration} onChange={e => setNewPhaseDuration(e.target.value)} placeholder="Wks" className={fieldClass + ' w-24 text-center shrink-0'} />
                  <PrimaryButton type="submit" disabled={isSavingPhase}>
                    {isSavingPhase ? 'Adding...' : <><Plus size={15} /> Add</>}
                  </PrimaryButton>
                </form>
              </div>
              <CardBody className="overflow-y-auto">
                {phases.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-600 py-12 flex flex-col items-center gap-2">
                    <Folder size={40} className="text-slate-200 dark:text-slate-700" />
                    <p className="text-sm">No phases added yet.</p>
                  </div>
                ) : (
                  phases.map((phase, index) => {
                    if (editingPhaseId === phase.id) {
                      return (
                        <div key={phase.id} className="p-3 border-b border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-3">
                          <span className="font-mono text-[11px] text-slate-400 w-6 shrink-0">#{phase.order}</span>
                          <form onSubmit={handleEditPhaseSave} className="flex-1 flex flex-col gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={editingPhaseName}
                              onChange={e => setEditingPhaseName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border-b border-blue-400 dark:border-blue-600 bg-transparent focus:outline-none font-semibold text-slate-800 dark:text-slate-200"
                            />
                            <div className="flex gap-2 items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">WKS:</span>
                                <input
                                  type="number"
                                  min="0.5" step="0.5"
                                  value={editingPhaseDuration}
                                  onChange={e => setEditingPhaseDuration(e.target.value)}
                                  className="w-16 px-2 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-center text-slate-800 dark:text-slate-200"
                                />
                              </div>
                              <div className="flex gap-1">
                                <IconButton type="button" onClick={() => setEditingPhaseId(null)}><X size={14} /></IconButton>
                                <IconButton type="submit" className="text-emerald-600 dark:text-emerald-400"><Check size={14} /></IconButton>
                              </div>
                            </div>
                          </form>
                        </div>
                      );
                    }

                    return (
                      <Row key={phase.id}>
                        <span className="font-mono text-[11px] text-slate-400 w-6 shrink-0">#{phase.order}</span>
                        <Tooltip content={phase.name} wrapper="span" className="flex-1 min-w-0 inline-block">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate block">{phase.name}</span>
                        </Tooltip>
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0">
                          <Clock size={12} />
                          {phase.durationWeeks} {phase.durationWeeks === 1 ? 'wk' : 'wks'}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
                          <IconButton onClick={() => handleMovePhase(index, 'up')} disabled={index === 0} aria-label="Move Up">
                            <ChevronUp size={14} />
                          </IconButton>
                          <IconButton onClick={() => handleMovePhase(index, 'down')} disabled={index === phases.length - 1} aria-label="Move Down">
                            <ChevronDown size={14} />
                          </IconButton>
                          <IconButton onClick={() => setSettingsPhaseId(phase.id!)} className="hover:text-blue-600 dark:hover:text-blue-400" aria-label="Edit Phase">
                            <Pencil size={14} />
                          </IconButton>
                          <IconButton onClick={() => setOpenPhaseMenuId(openPhaseMenuId === phase.id ? null : phase.id!)} aria-label="More actions">
                            <MoreVertical size={14} />
                          </IconButton>
                          {openPhaseMenuId === phase.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenPhaseMenuId(null)} />
                              <div className="absolute right-0 top-8 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                <button onClick={() => { setOpenPhaseMenuId(null); phase.id && handleClearPhase(phase.id); }} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                  <Eraser size={14} /> Clear Team &amp; Costs
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                <button onClick={() => { setOpenPhaseMenuId(null); phase.id && handleDeletePhase(phase.id); }} className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2">
                                  <Trash2 size={14} /> Delete Phase
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </Row>
                    );
                  })
                )}
              </CardBody>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3">
              <Folder size={40} className="text-slate-200 dark:text-slate-800" />
              <p className="text-sm">Select or create a project to manage its phases.</p>
            </div>
          )}
        </Card>

        {/* Payment Schedule Manager */}
        {activeProjectId ? (
          <PaymentScheduleManager
            projectId={activeProjectId}
            projectName={projects.find(p => p.id === activeProjectId)?.name}
            phases={phases}
            allocations={allocations}
            projectCosts={projectCosts}
            teamMembers={teamMembers}
            totalFee={totalFee}
            formatCurrency={formatCurrency}
          />
        ) : (
          <Card className="flex-1 items-center justify-center text-slate-400">
            <Folder size={40} className="text-slate-200 dark:text-slate-800 mb-3" />
            <p className="text-sm">Select a project to manage its payment schedule.</p>
          </Card>
        )}
      </div>

      <PromptModal
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        message={promptConfig.message}
        defaultValue={promptConfig.defaultValue}
        confirmText={promptConfig.confirmText}
        onConfirm={promptConfig.onConfirm}
        onCancel={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <PhaseSettingsModal
        isOpen={!!settingsPhaseId}
        onClose={() => setSettingsPhaseId(null)}
        phase={phases.find(p => p.id === settingsPhaseId) || null}
        onSave={handleSavePhaseSettings}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        secondaryAction={confirmConfig.secondaryAction}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

const STATUS_FILTERS = { Draft: true, Proposed: true, Active: true, Completed: true, Lost: true };

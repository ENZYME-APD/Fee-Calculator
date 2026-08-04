"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, addProject, updateProject, deleteProject, getPhases, addPhase, updatePhase, deletePhase, duplicateProject, clearPhase, getUsersByCompany } from '@/lib/firebase/db';
import { Project, Phase, User } from '@/lib/firebase/schema';
import { Folder, Plus, Trash2, Clock, Pencil, X, Check, Copy, Eraser, Calculator, ChevronUp, ChevronDown, Save, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { PaymentScheduleManager } from './PaymentScheduleManager';
import { useAuth } from '@/lib/auth/AuthContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { PromptModal } from '@/components/modals/PromptModal';

export function ProjectManager({ isTemplateMode = false }: { isTemplateMode?: boolean }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'Proposed': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Lost': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
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
  const [editingPhaseName, setEditingPhaseName] = useState('');
  const [editingPhaseDuration, setEditingPhaseDuration] = useState('');
  
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingPhase, setIsSavingPhase] = useState(false);

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
    setPhases(data.sort((a, b) => a.order - b.order));
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
          try {
            await duplicateProject(id, true, name.trim(), true);
            alert("Saved as template successfully! You can find it in Team Resources > Templates.");
          } catch(err) {
            alert("Failed to save template.");
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
    
    // Update orders
    newPhases[index].order = index + 1;
    newPhases[targetIndex].order = targetIndex + 1;

    // Optimistic update
    setPhases([...newPhases]);

    // DB update
    if (newPhases[index].id) await updatePhase(newPhases[index].id!, { order: newPhases[index].order });
    if (newPhases[targetIndex].id) await updatePhase(newPhases[targetIndex].id!, { order: newPhases[targetIndex].order });
  };

  if (loading) return <div className="p-8 text-slate-500">Loading projects...</div>;

  const sortedProjects = [...projects].sort((a, b) => {
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
    <div className="flex h-full gap-6 mx-auto w-full p-8" style={{ maxWidth: '1600px' }}>
      {/* Projects List */}
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">{isTemplateMode ? 'Project Templates' : 'Projects'}</h2>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'date' | 'name' | 'status');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
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
            <div className="flex flex-wrap gap-3 mt-1 text-[11px] font-medium uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span><span className="text-slate-500">Draft</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500"></span><span className="text-amber-600 dark:text-amber-500">Proposed</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500"></span><span className="text-emerald-600 dark:text-emerald-500">Active</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500"></span><span className="text-blue-600 dark:text-blue-500">Completed</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400 dark:bg-rose-500"></span><span className="text-rose-600 dark:text-rose-500">Lost</span></div>
            </div>
          )}
        </div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
          <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
            {!isTemplateMode && templates.length > 0 && (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              <button type="submit" disabled={!newProjectName.trim() || isSavingProject} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">{isSavingProject ? '...' : <Plus size={18} />}</button>
            </div>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
          {sortedProjects.map(p => {
            if (editingProjectId === p.id) {
              return (
                <div key={p.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 shadow-sm transition-colors">
                  <form onSubmit={handleEditProjectSave} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        value={editingProjectName} 
                        onChange={e => setEditingProjectName(e.target.value)} 
                        className="flex-1 px-2 py-1 text-sm border-b border-blue-400 dark:border-blue-600 focus:outline-none font-semibold text-blue-900 dark:text-blue-300 bg-transparent"
                      />
                      <button type="button" onClick={() => setEditingProjectId(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><X size={16} /></button>
                      <button type="submit" className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"><Check size={16} /></button>
                    </div>
                    {!isTemplateMode && (
                      <div className="flex gap-2 items-center text-xs">
                        <select 
                          value={editingProjectStatus} 
                          onChange={e => setEditingProjectStatus(e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Proposed">Proposed</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Lost">Lost</option>
                        </select>
                        <input 
                          type="date" 
                          value={new Date(editingProjectStartDate).toISOString().split('T')[0]}
                          onChange={e => setEditingProjectStartDate(new Date(e.target.value).getTime())}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        />
                        <select
                          value={editingProjectOwnerId}
                          onChange={e => setEditingProjectOwnerId(e.target.value)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-28 truncate"
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
              <div 
                key={p.id}
                onClick={() => setActiveProjectId(p.id!)}
                className={`p-3.5 rounded-xl cursor-pointer flex justify-between items-center group transition-colors ${activeProjectId === p.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2 flex-1">
                  <Folder size={20} className={`shrink-0 ${activeProjectId === p.id ? "text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className={`font-semibold text-sm truncate ${activeProjectId === p.id ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{p.name}</span>
                  {!isTemplateMode && (
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${getStatusColor(p.status || 'Draft')}`}>
                      {p.status || 'Draft'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isTemplateMode && (
                    <Tooltip content="Open Fee Proposal">
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard?project=${p.id}`); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                        <Calculator size={14} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content={isTemplateMode ? "Duplicate Template" : "Duplicate Project"}>
                    <button onClick={(e) => p.id && handleDuplicateProject(p.id, e)} className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-md transition-colors">
                      <Copy size={14} />
                    </button>
                  </Tooltip>
                  {!isTemplateMode && (
                    <Tooltip content="Save as Template">
                      <button onClick={(e) => p.id && handleSaveAsTemplate(p.id, e)} className="text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/50 rounded-md transition-colors">
                        <Save size={14} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content="Edit Name">
                    <button onClick={(e) => handleEditProjectStart(p, e)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                      <Pencil size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete">
                    <button onClick={(e) => p.id && handleDeleteProject(p.id, e)} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded-md transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && <div className="text-slate-400 text-center py-8 text-sm">No projects created yet.</div>}
        </div>
      </div>

      {/* Phases Manager */}
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        {activeProjectId ? (
          <>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
              <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">Project Phases</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage phases and durations for the selected project.</p>
            </div>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
              <form onSubmit={handleCreatePhase} className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phase Name</label>
                  <input type="text" required value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="e.g. Schematic Design" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-colors" />
                </div>
                <div className="flex gap-4 items-end">
                  <div className="w-36">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Duration (Wks)</label>
                    <input type="number" required min="0.5" step="0.5" value={newPhaseDuration} onChange={e => setNewPhaseDuration(e.target.value)} placeholder="e.g. 4" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-colors" />
                  </div>
                  <button type="submit" disabled={isSavingPhase || !newPhaseName.trim()} className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold whitespace-nowrap transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSavingPhase ? 'Adding...' : 'Add Phase'}
                  </button>
                </div>
              </form>
            </div>
            <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden space-y-3 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
              {phases.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-600 py-12 flex flex-col items-center gap-2">
                  <Folder size={48} className="text-slate-200 dark:text-slate-700" />
                  <p>No phases added yet.</p>
                </div>
              ) : (
                phases.map((phase, index) => {
                  if (editingPhaseId === phase.id) {
                    return (
                      <div key={phase.id} className="p-3 border border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4 transition-colors">
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">#{phase.order}</div>
                        <form onSubmit={handleEditPhaseSave} className="flex-1 flex flex-col gap-2">
                          <input 
                            type="text" 
                            autoFocus
                            value={editingPhaseName} 
                            onChange={e => setEditingPhaseName(e.target.value)} 
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 transition-colors"
                          />
                          <div className="flex gap-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">WKS:</span>
                              <input 
                                type="number"
                                min="0.5" step="0.5"
                                value={editingPhaseDuration}
                                onChange={e => setEditingPhaseDuration(e.target.value)}
                                className="w-20 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 text-center transition-colors"
                              />
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => setEditingPhaseId(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"><X size={16} /></button>
                              <button type="submit" className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 p-1"><Check size={16} /></button>
                            </div>
                          </div>
                        </form>
                      </div>
                    );
                  }

                  return (
                    <div key={phase.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-3 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0 transition-colors mt-0.5">#{phase.order}</div>
                        <Tooltip content={phase.name} wrapper="span">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug">{phase.name}</span>
                        </Tooltip>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-100 dark:border-slate-700 transition-colors">
                          <Clock size={14} />
                          {phase.durationWeeks} {phase.durationWeeks === 1 ? 'week' : 'weeks'}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col mr-1 border-r border-slate-200 dark:border-slate-700 pr-1">
                            <Tooltip content="Move Up">
                              <button onClick={() => handleMovePhase(index, 'up')} disabled={index === 0} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5 transition-colors">
                                <ChevronUp size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Move Down">
                              <button onClick={() => handleMovePhase(index, 'down')} disabled={index === phases.length - 1} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5 transition-colors">
                                <ChevronDown size={14} />
                              </button>
                            </Tooltip>
                          </div>
                          <Tooltip content="Clear all costs and resources">
                            <button onClick={() => phase.id && handleClearPhase(phase.id)} className="text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors">
                              <Eraser size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Edit Phase Name/Duration">
                            <button onClick={() => handleEditPhaseStart(phase)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <Pencil size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete Phase Entirely">
                            <button onClick={() => phase.id && handleDeletePhase(phase.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-4 transition-colors">
            <Folder size={48} className="text-slate-200 dark:text-slate-800" />
            <p>Select or create a project to manage its phases.</p>
          </div>
        )}
      </div>

      {/* Payment Schedule Manager */}
      {activeProjectId ? (
        <PaymentScheduleManager projectId={activeProjectId} phases={phases} />
      ) : (
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors items-center justify-center text-slate-400">
           <Folder size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
           <p>Select a project to manage its payment schedule.</p>
        </div>
      )}

      <PromptModal
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        message={promptConfig.message}
        defaultValue={promptConfig.defaultValue}
        confirmText={promptConfig.confirmText}
        onConfirm={promptConfig.onConfirm}
        onCancel={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
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

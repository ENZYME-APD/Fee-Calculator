"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, addProject, updateProject, deleteProject, getPhases, addPhase, updatePhase, deletePhase, duplicateProject, clearPhase } from '@/lib/firebase/db';
import { Project, Phase } from '@/lib/firebase/schema';
import { Folder, Plus, Trash2, Clock, Pencil, X, Check, Copy, Eraser, Calculator } from 'lucide-react';
import { PaymentScheduleManager } from './PaymentScheduleManager';

export function ProjectManager() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  
  // Edit Project
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  
  // New Phase Form
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDuration, setNewPhaseDuration] = useState('');
  
  // Edit Phase
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState('');
  const [editingPhaseDuration, setEditingPhaseDuration] = useState('');

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
    if (data.length > 0 && !activeProjectId) {
      setActiveProjectId(data[0].id!);
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const id = await addProject({ name: newProjectName, description: '', createdAt: Date.now() });
    setNewProjectName('');
    await loadProjects();
    setActiveProjectId(id);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      await deleteProject(id);
      if (activeProjectId === id) setActiveProjectId(null);
      loadProjects();
    }
  };

  const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const includeAllocations = window.confirm(
      "Duplicate this project exactly as is? \n\nClick 'OK' to keep all team members and project costs.\nClick 'Cancel' to create a clean template with empty phases."
    );
    try {
      const newProjectId = await duplicateProject(id, includeAllocations);
      await loadProjects();
      setActiveProjectId(newProjectId);
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      alert("Failed to duplicate project");
    }
  };

  const handleEditProjectStart = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(p.id!);
    setEditingProjectName(p.name);
  };

  const handleEditProjectSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProjectId && editingProjectName.trim()) {
      await updateProject(editingProjectId, { name: editingProjectName.trim() });
      await loadProjects();
    }
    setEditingProjectId(null);
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim() || !activeProjectId) return;
    await addPhase({
      projectId: activeProjectId,
      name: newPhaseName,
      description: '',
      durationWeeks: parseFloat(newPhaseDuration) || 1,
      order: phases.length + 1
    });
    setNewPhaseName('');
    setNewPhaseDuration('');
    loadPhases(activeProjectId);
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
    if (confirm('Delete this phase entirely?')) {
      await deletePhase(id);
      loadPhases(activeProjectId!);
    }
  };

  const handleClearPhase = async (id: string) => {
    if (confirm('Clear all team members and costs from this phase?')) {
      await clearPhase(id);
      alert('Phase cleared successfully.');
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading projects...</div>;

  return (
    <div className="flex h-full gap-6 mx-auto w-full p-8" style={{ maxWidth: '1600px' }}>
      {/* Projects List */}
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">Projects</h2>
        </div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
          <form onSubmit={handleCreateProject} className="flex gap-2">
            <input 
              type="text" 
              placeholder="New project name..." 
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            <button type="submit" disabled={!newProjectName} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"><Plus size={18} /></button>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
          {projects.map(p => {
            if (editingProjectId === p.id) {
              return (
                <div key={p.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 shadow-sm transition-colors">
                  <form onSubmit={handleEditProjectSave} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      autoFocus
                      value={editingProjectName} 
                      onChange={e => setEditingProjectName(e.target.value)} 
                      className="flex-1 px-2 py-1 text-sm border-b border-blue-400 dark:border-blue-600 focus:outline-none font-semibold text-blue-900 dark:text-blue-300 bg-transparent"
                    />
                    <button type="button" onClick={() => setEditingProjectId(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><X size={16} /></button>
                    <button type="submit" className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"><Check size={16} /></button>
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
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <Folder size={20} className={`shrink-0 ${activeProjectId === p.id ? "text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" : "text-slate-400 dark:text-slate-500"}`} />
                  <span title={p.name} className={`font-semibold text-sm truncate ${activeProjectId === p.id ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{p.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/?project=${p.id}`); }} title="Open Fee Proposal" className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                    <Calculator size={14} />
                  </button>
                  <button onClick={(e) => p.id && handleDuplicateProject(p.id, e)} title="Duplicate Project" className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-md transition-colors">
                    <Copy size={14} />
                  </button>
                  <button onClick={(e) => handleEditProjectStart(p, e)} title="Edit Name" className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={(e) => p.id && handleDeleteProject(p.id, e)} title="Delete Project" className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded-md transition-colors">
                    <Trash2 size={14} />
                  </button>
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
                  <button type="submit" className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold whitespace-nowrap transition-colors shadow-sm">Add Phase</button>
                </div>
              </form>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
              {phases.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-600 py-12 flex flex-col items-center gap-2">
                  <Folder size={48} className="text-slate-200 dark:text-slate-700" />
                  <p>No phases added yet.</p>
                </div>
              ) : (
                phases.map(phase => {
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
                        <span title={phase.name} className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug">{phase.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-100 dark:border-slate-700 transition-colors">
                          <Clock size={14} />
                          {phase.durationWeeks} {phase.durationWeeks === 1 ? 'week' : 'weeks'}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => phase.id && handleClearPhase(phase.id)} title="Clear all costs and resources" className="text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors">
                            <Eraser size={16} />
                          </button>
                          <button onClick={() => handleEditPhaseStart(phase)} title="Edit Phase Name/Duration" className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => phase.id && handleDeletePhase(phase.id)} title="Delete Phase Entirely" className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                            <Trash2 size={16} />
                          </button>
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
    </div>
  );
}

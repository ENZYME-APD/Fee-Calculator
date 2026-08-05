/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectSummary } from '@/components/calculator/ProjectSummary';
import { PaymentScheduleModal } from '@/components/calculator/PaymentScheduleModal';
import { getProjects, getPhases, getTeamMembers, getAllocations, importProjectData, getProjectCosts, getPayments, getCategories } from '@/lib/firebase/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { Project, Phase, TeamMember, Allocation, ProjectCost, Payment, TeamCategory } from '@/lib/firebase/schema';
import { Folder, Download, Upload, FileSpreadsheet, Table } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { exportProposalToExcel } from '@/lib/excelExport';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { dbUser } = useAuth();

  const loadData = async () => {
    const ownerId = dbUser?.role !== 'admin' ? dbUser?.uid : undefined;
    const projs = await getProjects(false, ownerId);
    const mems = await getTeamMembers();
    const allocs = await getAllocations();
    const cats = await getCategories();
    
    setProjects(projs);
    setMembers(mems);
    setAllocations(allocs);
    setCategories(cats);
    
    // Maintain active project if it exists in new data
    if (projs.length > 0) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const projectIdParam = params.get('project');
        if (projectIdParam) {
          const found = projs.find(p => p.id === projectIdParam);
          if (found) {
            setActiveProject(found);
            setLoading(false);
            return;
          }
        }
      }
      setActiveProject(prev => prev ? (projs.find(p => p.id === prev.id) || projs[0]) : projs[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeProject) {
      getPhases(activeProject.id!).then(data => setPhases(data.sort((a,b) => a.order - b.order)));
      getProjectCosts(activeProject.id!).then(data => setProjectCosts(data));
      getPayments(activeProject.id!).then(data => setPayments(data));
    } else {
      setPhases([]);
      setProjectCosts([]);
      setPayments([]);
    }
  }, [activeProject]);

  const handleAllocationAdded = () => {
    loadData();
    if (activeProject) {
      getProjectCosts(activeProject.id!).then(data => setProjectCosts(data));
    }
  };

  const handleExportJSON = () => {
    if (!activeProject) return;
    const data = {
      project: activeProject,
      phases,
      allocations,
      projectCosts
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${activeProject.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!activeProject) return;
    exportProposalToExcel(
      activeProject,
      phases,
      allocations,
      members,
      projectCosts,
      payments,
      categories,
      'USD' // or get currency from settings
    );
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.project && data.phases) {
           setLoading(true);
           const newId = await importProjectData(data);
           await loadData();
           const ownerId = dbUser?.role !== 'admin' ? dbUser?.uid : undefined;
           const projs = await getProjects(false, ownerId);
           const newlyImported = projs.find(p => p.id === newId);
           if (newlyImported) setActiveProject(newlyImported);
        } else {
           alert("Invalid project format.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) return <div className="p-8 text-slate-500">Loading calculator data...</div>;

  if (projects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <Folder size={48} className="text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Projects Found</h2>
        <p>Go to the Projects & Phases tab to create one.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Project Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pl-4 pr-6 py-3 flex items-center justify-between z-30 shrink-0 shadow-sm transition-colors duration-300">
        <div className="w-[304px] pr-4 border-r border-slate-200 dark:border-slate-800 flex items-center shrink-0">
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
            value={activeProject?.id || ''}
            onChange={(e) => setActiveProject(projects.find(p => p.id === e.target.value) || null)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          {activeProject && (
            <>
              <Tooltip content="Export Project Data" position="bottom">
                <button 
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm text-xs"
                >
                  <Download size={14} />
                  <span>Save</span>
                </button>
              </Tooltip>
              
              <Tooltip content="Import Project Data" position="bottom">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm text-xs"
                >
                  <Upload size={14} />
                  <span>Load</span>
                </button>
              </Tooltip>

              <Tooltip content="Export to Excel" position="bottom">
                <button 
                  id="tour-export-btn"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm text-xs"
                >
                  <Table size={14} />
                  <span>Excel</span>
                </button>
              </Tooltip>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportJSON} 
                accept=".json" 
                className="hidden" 
              />

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

              <div id="tour-summary-buttons" className="flex gap-3">
                <button 
                  onClick={() => setIsScheduleOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={16} className="text-blue-100" />
                  <span>Payment Schedule</span>
                </button>

                <button 
                  onClick={() => setIsSummaryOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Folder size={16} className="text-blue-100" />
                  <span>Financial Summary</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <AppLayout 
          project={activeProject}
          members={members} 
          phases={phases} 
          allocations={allocations} 
          projectCosts={projectCosts}
          onAllocationAdded={handleAllocationAdded}
        />
          {activeProject && isSummaryOpen && (
            <ProjectSummary 
              project={activeProject} 
              phases={phases} 
              allocations={allocations} 
              members={members} 
              projectCosts={projectCosts}
              payments={payments}
              onProjectUpdated={handleAllocationAdded}
              onPaymentUpdated={loadData}
              onClose={() => setIsSummaryOpen(false)}
            />
          )}
          {activeProject && isScheduleOpen && (
            <PaymentScheduleModal 
              project={activeProject} 
              phases={phases} 
              allocations={allocations} 
              members={members} 
              projectCosts={projectCosts}
              payments={payments}
              onClose={() => setIsScheduleOpen(false)}
            />
          )}
      </div>
    </div>
  );
}

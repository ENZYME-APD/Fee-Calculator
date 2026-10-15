/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectSummary } from '@/components/calculator/ProjectSummary';
import { PaymentScheduleModal } from '@/components/calculator/PaymentScheduleModal';
import { getProjects, getPhases, getTeamMembers, getAllocations, importProjectData, getProjectCosts, getPayments, getCategories } from '@/lib/firebase/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { Project, Phase, TeamMember, Allocation, ProjectCost, Payment, TeamCategory } from '@/lib/firebase/schema';
import { Folder, Download, Upload, FileSpreadsheet, Table, Calculator } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { exportProposalToExcel } from '@/lib/excelExport';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <FeeProposalPage />
    </Suspense>
  );
}

function FeeProposalPage() {
  // Read ?project= from the router, not window.location: on client navigation the
  // browser URL is updated after this page's first effects run.
  const projectParam = useSearchParams().get('project');
  const projectParamRef = useRef(projectParam);
  projectParamRef.current = projectParam;
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
      const projectIdParam = projectParamRef.current;
      if (projectIdParam) {
        const found = projs.find(p => p.id === projectIdParam);
        if (found) {
          setActiveProject(prev => (prev?.id === found.id ? prev : found));
          setLoading(false);
          return;
        }
      }
      const defaultProject = projs.find(p => p.status !== 'Lost') || projs[0];
      setActiveProject(prev => prev ? (projs.find(p => p.id === prev.id) || defaultProject) : defaultProject);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // A link to another project while already on this page (e.g. from the dashboard)
  useEffect(() => {
    if (!projectParam) return;
    const found = projects.find(p => p.id === projectParam);
    if (found) setActiveProject(prev => (prev?.id === found.id ? prev : found));
  }, [projectParam, projects]);

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

  if (loading) return <div className="p-8 text-ink-500">Loading calculator data...</div>;

  if (projects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-ink-500 dark:text-ink-400 gap-4 bg-ink-50 dark:bg-ink-900 transition-colors duration-300">
        <Folder size={48} className="text-ink-300 dark:text-ink-700" />
        <h2 className="text-xl font-bold text-ink-700 dark:text-ink-200">No projects found</h2>
        <p>Go to the Projects & Phases tab to create one.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-ink-50 dark:bg-ink-950 transition-colors duration-300">
      {/* Top Toolbar — same shape as Project Planning and Document Builder */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 px-6 py-3 flex items-center justify-between z-30 shrink-0 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-ink-700 dark:text-ink-300 font-bold shrink-0">
            <Calculator size={18} className="text-accent-600 dark:text-accent-400" />
            <span className="text-sm">Fee proposal</span>
          </div>
          <div className="w-[300px]">
          <select
            className="w-full bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-800 dark:text-ink-200 font-bold rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent-500/20 outline-none transition-colors cursor-pointer"
            value={activeProject?.id || ''}
            onChange={(e) => {
              const p = projects.find(proj => proj.id === e.target.value) || null;
              setActiveProject(p);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                if (p) {
                  url.searchParams.set('project', p.id!);
                } else {
                  url.searchParams.delete('project');
                }
                window.history.replaceState({}, '', url.toString());
              }
            }}
          >
            {projects
              .filter(p => p.status !== 'Lost' || p.id === activeProject?.id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.status === 'Lost' ? ' (Lost/archived)' : ''}</option>
              ))}
          </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeProject && (
            <>
              <Tooltip content="Export Project Data" position="bottom">
                <button 
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-ink-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors shadow-sm text-xs"
                >
                  <Download size={14} />
                  <span>Save</span>
                </button>
              </Tooltip>
              
              <Tooltip content="Import Project Data" position="bottom">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-ink-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors shadow-sm text-xs"
                >
                  <Upload size={14} />
                  <span>Load</span>
                </button>
              </Tooltip>

              <Tooltip content="Export to Excel" position="bottom">
                <button 
                  id="tour-export-btn"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 bg-positive-50 dark:bg-positive-900/30 text-positive-600 dark:text-positive-400 border border-positive-200 dark:border-positive-800/50 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-positive-100 dark:hover:bg-positive-900/50 transition-colors shadow-sm text-xs"
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

              <div className="w-px h-6 bg-ink-200 dark:bg-ink-700 mx-1" />

              <div id="tour-summary-buttons" className="flex gap-3">
                <button 
                  onClick={() => setIsScheduleOpen(true)}
                  className="flex items-center gap-1.5 bg-accent-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-accent-700 transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={16} className="text-accent-100" />
                  <span>Payment schedule</span>
                </button>

                <button 
                  onClick={() => setIsSummaryOpen(true)}
                  className="flex items-center gap-1.5 bg-accent-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-accent-700 transition-colors shadow-sm"
                >
                  <Folder size={16} className="text-accent-100" />
                  <span>Financial summary</span>
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

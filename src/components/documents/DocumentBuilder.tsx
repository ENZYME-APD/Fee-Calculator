"use client";
import React, { useState, useEffect } from 'react';

import { Project, Phase, DocumentBlock, Allocation, ProjectCost, TeamMember, TeamCategory, Payment, SavedBlock } from '@/lib/firebase/schema';
import { getProjects, getPhases, getDocumentBlocks, initializeDefaultBlocks, updateDocumentBlock, addDocumentBlock, deleteDocumentBlock, getTeamMembers, getCategories, getAllocations, getProjectCosts, getPayments, getSavedBlocks, addSavedBlock, deleteSavedBlock } from '@/lib/firebase/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import { FileText, Download, Printer, Plus, LayoutTemplate, Folder, Bookmark, Trash2 } from 'lucide-react';
import { exportToDocx } from '@/lib/utils/docxExport';
import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';
import { PromptModal } from '@/components/modals/PromptModal';
import { useSearchParams, useRouter } from 'next/navigation';

export function DocumentBuilder() {
  const { dbCompany } = useAuth();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project');
  

  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    defaultValue: string;
    block: DocumentBlock | null;
    currentContent: string;
    currentTitle: string;
  }>({
    isOpen: false,
    defaultValue: '',
    block: null,
    currentContent: '',
    currentTitle: ''
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId || null);
  
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([]);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (initialProjectId && initialProjectId !== activeProjectId) {
      setActiveProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (dbCompany) {
      loadData();
    }
  }, [dbCompany]);

  const loadData = async () => {
    setLoading(true);
    const [projs, m, c, a, pCosts] = await Promise.all([
      getProjects(),
      getTeamMembers(),
      getCategories(),
      getAllocations(),
      getProjectCosts()
    ]);
    setProjects(projs);
    setMembers(m);
    setCategories(c);
    setAllocations(a);
    setCosts(pCosts);
    setLoading(false);
  };

  useEffect(() => {
    if (activeProjectId) {
      loadProjectData(activeProjectId);
    } else {
      setBlocks([]);
      setPhases([]);
    }
  }, [activeProjectId]);

  const loadProjectData = async (projectId: string) => {
    const p = await getPhases(projectId);
    setPhases(p.sort((a, b) => a.order - b.order));
    const b = await getDocumentBlocks(dbCompany!.id!, projectId);
    setBlocks(b);
    const pay = await getPayments(projectId);
    setPayments(pay.sort((a, b) => a.order - b.order));
  };

  const handleGenerateDefaults = async () => {
    if (!activeProjectId || !dbCompany) return;
    setLoading(true);
    await initializeDefaultBlocks(dbCompany.id!, activeProjectId);
    await loadProjectData(activeProjectId);
    setLoading(false);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));
      
      setBlocks(newBlocks);
      
      // Update in DB
      const promises = newBlocks.map((b) => updateDocumentBlock(b.id!, { order: b.order }));
      await Promise.all(promises);
    }
  };

  const handleAddBlock = async (type: DocumentBlock['type']) => {
    if (!activeProjectId || !dbCompany) return;
    const newBlock: Omit<DocumentBlock, 'id'> = {
      companyId: dbCompany.id!,
      projectId: activeProjectId,
      type,
      title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : type === 'payment_schedule' ? 'Payment Schedule' : 'Project Scope',
      content: type === 'rich_text' ? '<p>Enter text here...</p>' : '',
      order: blocks.length
    };
    const id = await addDocumentBlock(newBlock);
    setBlocks([...blocks, { ...newBlock, id }]);
  };

  
  
  const handleSaveTemplate = (block: DocumentBlock, currentContent: string, currentTitle: string) => {
    setPromptConfig({
      isOpen: true,
      defaultValue: currentTitle,
      block,
      currentContent,
      currentTitle
    });
  };

  const executeSaveTemplate = async (name: string) => {
    setPromptConfig(prev => ({ ...prev, isOpen: false }));
    if (!name.trim() || !promptConfig.block || !dbCompany?.id) return;
    
    const newTemplate: Omit<SavedBlock, 'id'> = {
      companyId: dbCompany.id,
      templateName: name.trim(),
      type: promptConfig.block.type,
      title: promptConfig.currentTitle,
      content: promptConfig.currentContent
    };
    
    try {
      const id = await addSavedBlock(newTemplate);
      setSavedBlocks([...savedBlocks, { ...newTemplate, id }]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template saved successfully!' } }));
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to save template' } }));
    }
  };

  const handleInsertTemplate = async (template: SavedBlock) => {
    if (!dbCompany?.id || !activeProjectId) return;
    
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order), -1);
    
    const newBlock: Partial<DocumentBlock> = {
      projectId: activeProjectId,
      type: template.type,
      title: template.title,
      content: template.content,
      order: maxOrder + 1
    };
    
    try {
      const id = await addDocumentBlock(newBlock as Omit<DocumentBlock, 'id'>);
      setBlocks([...blocks, { ...newBlock, id } as DocumentBlock]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template inserted!' } }));
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to insert template' } }));
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteSavedBlock(id);
        setSavedBlocks(savedBlocks.filter(b => b.id !== id));
      } catch (error) {
        console.error(error);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to delete template' } }));
      }
    }
  };
  
  const handleInsertBlock = async (type: DocumentBlock['type'], afterIndex: number) => {
    if (!activeProjectId || !dbCompany) return;
    
    // Create new block
    const newBlock: Omit<DocumentBlock, 'id'> = {
      companyId: dbCompany.id!,
      projectId: activeProjectId,
      type,
      title: type === 'rich_text' ? 'New Section' : type === 'financial_summary' ? 'Financial Summary' : type === 'payment_schedule' ? 'Payment Schedule' : 'Project Scope',
      content: type === 'rich_text' ? '<p>Enter text here...</p>' : '',
      order: afterIndex
    };
    
    const id = await addDocumentBlock(newBlock);
    const blockWithId = { ...newBlock, id };
    
    // Shift all subsequent blocks order + 1
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex, 0, blockWithId);
    
    const updatedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(updatedBlocks);
    
    // Update DB for shifted blocks
    const promises = updatedBlocks.slice(afterIndex).map(b => updateDocumentBlock(b.id!, { order: b.order }));
    await Promise.all(promises);
  };

  const handleDeleteBlock = async (id: string) => {
    await deleteDocumentBlock(id);
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleUpdateBlockContent = async (id: string, content: string, title: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, title } : b));
    await updateDocumentBlock(id, { content, title });
  };

  const handleExportWord = async () => {
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) return;
    setIsExporting(true);
    try {
      await exportToDocx(project, blocks, phases, allocations, costs, members, categories, payments);
    } catch (e) {
      console.error(e);
      alert('Error exporting document.');
    }
    setIsExporting(false);
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-slate-500">Loading document builder...</div>;

  if (dbCompany?.tier !== 'pro' && dbCompany?.subscriptionStatus !== 'lifetime') {
    return <ProUpgradePrompt 
      title="Professional Proposals in Seconds" 
      description="The Document Builder automatically generates beautiful proposals from your fee estimates. Drag and drop modular blocks, add rich text, and export flawlessly to PDF or native Microsoft Word documents." 
    />;
  }

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950">
      
      {/* Project Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full print:hidden">
        {/* Project Selector (Top Half) */}
        <div className="flex flex-col h-1/2 border-b border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Folder size={18} className="text-blue-500" />
              Proposals
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {projects.filter(p => !p.isTemplate).map(project => (
              <button
                key={project.id}
                onClick={() => setActiveProjectId(project.id!)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeProjectId === project.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm border border-blue-100 dark:border-blue-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{project.name}</span>
                  {activeProjectId === project.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Library (Bottom Half) */}
        <div className="flex flex-col h-1/2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bookmark size={18} className="text-emerald-500" />
              Saved Templates
            </h3>
            <p className="text-xs text-slate-500 mt-1">Click to append to document</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {savedBlocks.length === 0 ? (
              <div className="text-center p-4 text-sm text-slate-400">
                No templates saved yet. Click the bookmark icon on any block to save it.
              </div>
            ) : (
              savedBlocks.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleInsertTemplate(template)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{template.templateName}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{template.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Insert Template">
                      <Plus size={14} />
                    </div>
                    <div onClick={(e) => handleDeleteTemplate(template.id!, e)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors" title="Delete Template">
                      <Trash2 size={14} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
<div className="flex-1 flex flex-col h-full relative">
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {activeProjectId ? projects.find(p => p.id === activeProjectId)?.name : 'Document Builder'}
            </h2>
          </div>
          
          {activeProjectId && blocks.length > 0 && (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportWord}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                <Download size={16} /> Export to Word
              </button>
              <button 
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                <Printer size={16} /> Print PDF
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:bg-white bg-slate-100 dark:bg-slate-950">
          {!activeProjectId ? (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 h-full">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a project to build its proposal document</p>
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 h-[60vh] max-w-md mx-auto text-center">
              <LayoutTemplate size={48} className="mb-4 text-blue-500 opacity-50" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Document Blocks</h3>
              <p className="text-sm mb-6">Generate a default proposal layout automatically pulling data from your fee estimates.</p>
              <button 
                onClick={handleGenerateDefaults}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                Generate Default Proposal
              </button>
            </div>
          ) : (
            <div className="w-full max-w-[850px] mx-auto bg-white dark:bg-slate-900 print:shadow-none shadow-xl border border-slate-200 dark:border-slate-800 print:border-none min-h-[1100px] p-16 print:p-0 relative">
              
              
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-12">
                Fee Proposal: {projects.find(p => p.id === activeProjectId)?.name}
              </h1>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={blocks.map(b => b.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {blocks.map((block, index) => (
                      <SortableBlock 
                        onSaveTemplate={handleSaveTemplate}
                        key={block.id} 
                        block={block} 
                        phases={phases}
                        allocations={allocations}
                        costs={costs}
                        members={members}
                        categories={categories}
                        project={projects.find(p => p.id === activeProjectId)!}
                        payments={payments}
                        onUpdate={(content, title) => handleUpdateBlockContent(block.id!, content, title)}
                        onDelete={() => handleDeleteBlock(block.id!)}
                      onInsert={(type) => handleInsertBlock(type, index + 1)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>

      <PromptModal
        isOpen={promptConfig.isOpen}
        title="Save Template"
        message="Enter a name for this template so you can easily identify it in your library."
        defaultValue={promptConfig.defaultValue}
        placeholder="e.g. Standard Section"
        confirmText="Save"
        onConfirm={executeSaveTemplate}
        onCancel={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

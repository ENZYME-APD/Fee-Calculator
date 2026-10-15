"use client";
import React, { useState, useEffect } from 'react';

import { Project, Phase, DocumentBlock, Allocation, ProjectCost, TeamMember, TeamCategory, Payment, SavedBlock } from '@/lib/firebase/schema';
import { getProjects, getPhases, getDocumentBlocks, initializeDefaultBlocks, updateDocumentBlock, addDocumentBlock, deleteDocumentBlock, getTeamMembers, getCategories, getAllocations, getProjectCosts, getPayments, getSavedBlocks, addSavedBlock, deleteSavedBlock } from '@/lib/firebase/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDraggable, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import { FileText, Download, Printer, Plus, LayoutTemplate, Eye, EyeOff, Bookmark, Trash2 } from 'lucide-react';
import { exportToDocx } from '@/lib/utils/docxExport';
import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';
import { PromptModal } from '@/components/modals/PromptModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { useSearchParams, useRouter } from 'next/navigation';


function SidebarTemplateItem({ template, onInsert, onDelete }: { template: SavedBlock, onInsert: () => void, onDelete: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: { type: 'template', template }
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onInsert}
      className={`w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 shadow-sm hover:shadow-md hover:border-positive-200 dark:hover:border-positive-800/50 transition-all cursor-grab active:cursor-grabbing group flex items-start justify-between ${isDragging ? 'opacity-50 ring-2 ring-positive-500' : ''}`}
    >
      <div className="flex flex-col overflow-hidden pointer-events-none">
        <span className="text-sm font-medium text-ink-700 dark:text-ink-300 truncate">{template.templateName}</span>
        <span className="text-xs text-ink-500 mt-1">{template.type.replace('_', ' ').replace(/^./, (c) => c.toUpperCase())}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1.5 text-positive-500 hover:bg-positive-50 dark:hover:bg-positive-900/30 rounded-md transition-colors" title="Drag or Click to Insert">
          <Plus size={14} />
        </div>
        <div onPointerDown={(e) => e.stopPropagation()} onClick={onDelete} className="p-1.5 text-negative-400 hover:text-negative-600 hover:bg-negative-50 dark:hover:bg-negative-900/30 rounded-md transition-colors" title="Delete Template">
          <Trash2 size={14} />
        </div>
      </div>
    </div>
  );
}

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
  const [showLost, setShowLost] = useState(false);
  
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);

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
    const [projs, m, c, a, pCosts, saved] = await Promise.all([
      getProjects(),
      getTeamMembers(),
      getCategories(),
      getAllocations(),
      getProjectCosts(),
      getSavedBlocks(dbCompany!.id!)
    ]);
    setProjects(projs);
    setMembers(m);
    setCategories(c);
    setAllocations(a);
    setCosts(pCosts);
    setSavedBlocks(saved);
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

  
  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || !activeProjectId || !dbCompany) return;

    if (active.data.current?.type === 'template') {
      const template = active.data.current.template as SavedBlock;
      let targetIndex = blocks.findIndex((b) => b.id === over.id);
      if (targetIndex === -1) targetIndex = blocks.length;
      
      const newBlock: Partial<DocumentBlock> = {
        companyId: dbCompany.id!,
        projectId: activeProjectId,
        type: template.type,
        title: template.title,
        content: template.content,
        order: targetIndex
      };
      
      // Shift other blocks down
      const newBlocks = [...blocks];
      newBlocks.splice(targetIndex, 0, newBlock as DocumentBlock);
      const orderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
      
      try {
        const id = await addDocumentBlock(newBlock as Omit<DocumentBlock, 'id'>);
        const savedBlock = { ...orderedBlocks[targetIndex], id };
        orderedBlocks[targetIndex] = savedBlock;
        setBlocks(orderedBlocks as DocumentBlock[]);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template inserted!' } }));
        
        const promises = orderedBlocks.map(b => updateDocumentBlock(b.id!, { order: b.order }));
        await Promise.all(promises);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));
      
      setBlocks(newBlocks);
      
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
      companyId: dbCompany.id,
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

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteTemplateId(id);
  };

  const executeDeleteTemplate = async () => {
    if (!confirmDeleteTemplateId) return;
    try {
      await deleteSavedBlock(confirmDeleteTemplateId);
      setSavedBlocks(savedBlocks.filter(b => b.id !== confirmDeleteTemplateId));
      setConfirmDeleteTemplateId(null);
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to delete template' } }));
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

  if (loading) return <div className="p-8 text-ink-500">Loading document builder...</div>;

  if (dbCompany?.tier !== 'pro' && dbCompany?.subscriptionStatus !== 'lifetime') {
    return <ProUpgradePrompt 
      title="Professional Proposals in Seconds" 
      description="The Document Builder automatically generates beautiful proposals from your fee estimates. Drag and drop modular blocks, add rich text, and export flawlessly to PDF or native Microsoft Word documents." 
    />;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="flex h-full w-full bg-ink-50 dark:bg-ink-950">
      
      {/* Templates Sidebar */}
      <div className="w-72 bg-white dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 flex flex-col shrink-0 h-full print:hidden">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-ink-200 dark:border-ink-800 shrink-0">
            <h3 className="font-bold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <Bookmark size={18} className="text-positive-500" />
              Saved Templates
            </h3>
            <p className="text-xs text-ink-500 mt-1">Click to append to document</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {savedBlocks.length === 0 ? (
              <div className="text-center p-4 text-sm text-ink-500">
                No templates saved yet. Click the bookmark icon on any block to save it.
              </div>
            ) : (
              savedBlocks.map(template => (
                <SidebarTemplateItem
                  key={template.id}
                  template={template}
                  onInsert={() => handleInsertTemplate(template)}
                  onDelete={(e) => handleDeleteTemplate(template.id!, e)}
                />
              ))
            )}
          </div>
        </div>
      </div>
<div className="flex-1 flex flex-col h-full relative">
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 shrink-0 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-ink-700 dark:text-ink-300 font-bold shrink-0">
              <FileText size={18} className="text-accent-600 dark:text-accent-400" />
              <span className="text-sm">Document builder</span>
            </div>
            <div className="w-[300px] flex items-center">
              <select
                className="w-full bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-800 dark:text-ink-200 font-bold rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent-500/20 outline-none transition-colors cursor-pointer"
                value={activeProjectId || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveProjectId(newId || null);
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    if (newId) {
                      url.searchParams.set('project', newId);
                    } else {
                      url.searchParams.delete('project');
                    }
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
              >
                <option value="">Select a project...</option>
                {projects
                  .filter(p => !p.isTemplate && (showLost || p.status !== "Lost"))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.status === 'Lost' ? ' (Lost/archived)' : ''}</option>
                  ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowLost(!showLost)}
              className="text-xs text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {showLost ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showLost ? 'Hide Lost/archived' : 'Show Lost/archived'}</span>
            </button>
          </div>

          {activeProjectId && blocks.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportWord}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                <Download size={16} /> Export to Word
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-300 rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                <Printer size={16} /> Print PDF
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:bg-white bg-ink-100 dark:bg-ink-950">
          {!activeProjectId ? (
            <div className="flex flex-col items-center justify-center text-ink-500 dark:text-ink-400 h-full">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a project to build its proposal document</p>
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-ink-500 dark:text-ink-400 h-[60vh] max-w-md mx-auto text-center">
              <LayoutTemplate size={48} className="mb-4 text-accent-500 opacity-50" />
              <h3 className="text-xl font-bold text-ink-700 dark:text-ink-300 mb-2">No document blocks</h3>
              <p className="text-sm mb-6">Generate a default proposal layout automatically pulling data from your fee estimates.</p>
              <button 
                onClick={handleGenerateDefaults}
                className="px-6 py-3 bg-accent-600 text-white font-bold rounded-xl hover:bg-accent-700 transition-colors shadow-md"
              >
                Generate Default Proposal
              </button>
            </div>
          ) : (
            <div className="w-full max-w-[850px] mx-auto bg-white dark:bg-ink-900 print:shadow-none shadow-xl border border-ink-200 dark:border-ink-800 print:border-none min-h-[1100px] p-16 print:p-0 relative">
              
              
              <h1 className="text-4xl font-black text-ink-900 dark:text-ink-50 mb-12">
                Fee Proposal: {projects.find(p => p.id === activeProjectId)?.name}
              </h1>

              
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
      <ConfirmModal
        isOpen={!!confirmDeleteTemplateId}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmText="Delete"
        onConfirm={executeDeleteTemplate}
        onCancel={() => setConfirmDeleteTemplateId(null)}
      />
    </div>
    <DragOverlay>
      {activeDragId && activeDragId.toString().startsWith('template-') ? (
        <div className="w-64 px-4 py-3 rounded-xl bg-white dark:bg-ink-800 border border-positive-500 shadow-2xl opacity-90 cursor-grabbing">
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-300 truncate">Dragging Template...</span>
          </div>
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
}
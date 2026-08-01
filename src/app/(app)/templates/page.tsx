"use client";
import React, { useState } from 'react';
import { ProjectManager } from '@/components/projects/ProjectManager';
import { LayoutTemplate } from 'lucide-react';
import { addProject, addPhase } from '@/lib/firebase/db';

export default function TemplatesPage() {
  const [seeding, setSeeding] = useState(false);

  const handleSeedRiba = async () => {
    setSeeding(true);
    try {
      const templateId = await addProject({
        name: 'RIBA Stages (UK Standard)',
        description: 'Standard RIBA Plan of Work stages for architectural projects.',
        createdAt: Date.now(),
        profitMargin: 30,
        isTemplate: true
      });

      const ribaStages = [
        { name: 'Stage 0: Strategic Definition', durationWeeks: 2 },
        { name: 'Stage 1: Preparation and Brief', durationWeeks: 4 },
        { name: 'Stage 2: Concept Design', durationWeeks: 6 },
        { name: 'Stage 3: Spatial Coordination', durationWeeks: 8 },
        { name: 'Stage 4: Technical Design', durationWeeks: 12 },
        { name: 'Stage 5: Manufacturing and Construction', durationWeeks: 52 },
        { name: 'Stage 6: Handover', durationWeeks: 2 },
        { name: 'Stage 7: Use', durationWeeks: 1 },
      ];

      for (let i = 0; i < ribaStages.length; i++) {
        const stage = ribaStages[i];
        await addPhase({
          projectId: templateId,
          name: stage.name,
          description: '',
          durationWeeks: stage.durationWeeks,
          order: i + 1
        });
      }

      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to seed template');
    }
    setSeeding(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex justify-between items-center z-30 shrink-0 shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Project Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Create reusable project structures and phases.</p>
        </div>
        <button 
          onClick={handleSeedRiba}
          disabled={seeding}
          className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
        >
          <LayoutTemplate size={18} />
          {seeding ? 'Creating...' : 'Seed RIBA Template'}
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ProjectManager isTemplateMode={true} />
      </div>
    </div>
  );
}

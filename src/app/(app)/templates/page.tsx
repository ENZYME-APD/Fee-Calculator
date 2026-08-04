"use client";
import React, { useState } from 'react';
import { ProjectManager } from '@/components/projects/ProjectManager';
import { LayoutTemplate } from 'lucide-react';
import { addProject, addPhase } from '@/lib/firebase/db';

const INTERNATIONAL_TEMPLATES = {
  'riba': {
    name: 'RIBA Stages (UK Standard)',
    description: 'Standard RIBA Plan of Work stages for architectural projects.',
    stages: [
      { name: 'Stage 0: Strategic Definition', durationWeeks: 2 },
      { name: 'Stage 1: Preparation and Brief', durationWeeks: 4 },
      { name: 'Stage 2: Concept Design', durationWeeks: 6 },
      { name: 'Stage 3: Spatial Coordination', durationWeeks: 8 },
      { name: 'Stage 4: Technical Design', durationWeeks: 12 },
      { name: 'Stage 5: Manufacturing and Construction', durationWeeks: 52 },
      { name: 'Stage 6: Handover', durationWeeks: 2 },
      { name: 'Stage 7: Use', durationWeeks: 1 },
    ]
  },
  'aia-us': {
    name: 'AIA (US Standard)',
    description: 'American Institute of Architects standard phases.',
    stages: [
      { name: 'Schematic Design', durationWeeks: 4 },
      { name: 'Design Development', durationWeeks: 8 },
      { name: 'Construction Documents', durationWeeks: 12 },
      { name: 'Bidding & Negotiation', durationWeeks: 4 },
      { name: 'Construction Administration', durationWeeks: 52 },
    ]
  },
  'raic': {
    name: 'RAIC (Canada Standard)',
    description: 'Royal Architectural Institute of Canada standard phases.',
    stages: [
      { name: 'Schematic Design', durationWeeks: 4 },
      { name: 'Design Development', durationWeeks: 8 },
      { name: 'Construction Documents', durationWeeks: 12 },
      { name: 'Bidding & Negotiation', durationWeeks: 4 },
      { name: 'Construction Administration', durationWeeks: 52 },
    ]
  },
  'loi-mop': {
    name: 'Loi MOP (France Standard)',
    description: 'French public works standard phases.',
    stages: [
      { name: 'ESQ: Esquisse', durationWeeks: 4 },
      { name: 'APS: Avant-Projet Sommaire', durationWeeks: 4 },
      { name: 'APD: Avant-Projet Définitif', durationWeeks: 8 },
      { name: 'PRO: Projet', durationWeeks: 12 },
      { name: 'ACT: Assistance Passation Contrats', durationWeeks: 4 },
      { name: 'DET: Direction Exécution Travaux', durationWeeks: 52 },
      { name: 'AOR: Assistance Opérations Réception', durationWeeks: 4 },
    ]
  },
  'cscae': {
    name: 'CSCAE (Spain Standard)',
    description: 'Spanish standard phases.',
    stages: [
      { name: 'Anteproyecto', durationWeeks: 4 },
      { name: 'Proyecto Básico', durationWeeks: 8 },
      { name: 'Proyecto de Ejecución', durationWeeks: 12 },
      { name: 'Dirección de Obra', durationWeeks: 52 },
    ]
  },
  'aia-au': {
    name: 'AIA Outline (Australia Standard)',
    description: 'Australian Institute of Architects standard phases.',
    stages: [
      { name: 'Concept Design', durationWeeks: 6 },
      { name: 'Design Development', durationWeeks: 8 },
      { name: 'Construction Documentation', durationWeeks: 12 },
      { name: 'Manufacturing & Construction', durationWeeks: 52 },
    ]
  },
  'japan': {
    name: 'Standard Phases (Japan)',
    description: 'Japanese common architectural phases.',
    stages: [
      { name: 'Initial / Planning', durationWeeks: 4 },
      { name: 'Basic Design', durationWeeks: 8 },
      { name: 'Detailed Design', durationWeeks: 16 },
      { name: 'Supervision', durationWeeks: 52 },
    ]
  },
  'china': {
    name: 'Standard Phases (China)',
    description: 'Chinese common architectural phases.',
    stages: [
      { name: 'Schematic Design', durationWeeks: 4 },
      { name: 'Design Development', durationWeeks: 8 },
      { name: 'Construction Documents', durationWeeks: 16 },
      { name: 'Bidding and Negotiation', durationWeeks: 4 },
      { name: 'Construction Administration', durationWeeks: 52 },
    ]
  }
};

type TemplateKey = keyof typeof INTERNATIONAL_TEMPLATES;

export default function TemplatesPage() {
  const [seeding, setSeeding] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('riba');

  const handleSeedTemplate = async () => {
    setSeeding(true);
    try {
      const templateData = INTERNATIONAL_TEMPLATES[selectedTemplate];
      
      const templateId = await addProject({
        name: templateData.name,
        description: templateData.description,
        createdAt: Date.now(),
        profitMargin: 30,
        isTemplate: true
      });

      for (let i = 0; i < templateData.stages.length; i++) {
        const stage = templateData.stages[i];
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
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-30 shrink-0 shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Project Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Create reusable project structures and phases.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as TemplateKey)}
            className="flex-1 sm:w-64 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {Object.entries(INTERNATIONAL_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
          
          <button 
            onClick={handleSeedTemplate}
            disabled={seeding}
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <LayoutTemplate size={18} />
            {seeding ? 'Creating...' : 'Seed Template'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ProjectManager isTemplateMode={true} />
      </div>
    </div>
  );
}

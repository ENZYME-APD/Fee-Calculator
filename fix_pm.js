const fs = require('fs');

const pmFile = 'src/components/projects/ProjectManager.tsx';
let pmCode = fs.readFileSync(pmFile, 'utf8');

// Imports
if (!pmCode.includes('PhaseSettingsModal')) {
  pmCode = pmCode.replace(
    "import { Plus, Trash2, Edit2, Check, X, GripVertical, Settings, FileText, Eraser, Pencil, ChevronDown, ChevronUp, Folder } from 'lucide-react';",
    "import { Plus, Trash2, Edit2, Check, X, GripVertical, Settings, FileText, Eraser, Pencil, ChevronDown, ChevronUp, Folder } from 'lucide-react';\nimport { PhaseSettingsModal } from '@/components/modals/PhaseSettingsModal';"
  );
}

// State
if (!pmCode.includes('const [settingsPhaseId, setSettingsPhaseId]')) {
  pmCode = pmCode.replace(
    'const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);',
    'const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);\n  const [settingsPhaseId, setSettingsPhaseId] = useState<string | null>(null);'
  );
}

// Handler
const saveHandler = `
  const handleSavePhaseSettings = async (id: string, updates: Partial<Phase>) => {
    await updatePhase(id, updates);
    await loadPhases(activeProjectId!);
  };
`;
if (!pmCode.includes('handleSavePhaseSettings')) {
  pmCode = pmCode.replace(
    'const handleEditPhaseStart = (p: Phase) => {',
    saveHandler + '\n  const handleEditPhaseStart = (p: Phase) => {'
  );
}

// Change the Pencil button
pmCode = pmCode.replace(
  'onClick={() => handleEditPhaseStart(phase)}',
  'onClick={() => setSettingsPhaseId(phase.id!)}'
);

// We need to render the Modal
const modalJSX = `
        <PhaseSettingsModal 
          isOpen={!!settingsPhaseId}
          onClose={() => setSettingsPhaseId(null)}
          phase={phases.find(p => p.id === settingsPhaseId) || null}
          onSave={handleSavePhaseSettings}
        />
`;

if (!pmCode.includes('PhaseSettingsModal isOpen')) {
  pmCode = pmCode.replace(
    '      <ConfirmModal',
    modalJSX + '\n      <ConfirmModal'
  );
}

// We completely replace the inline editing feature with just the Modal!
// So let's delete the block `if (editingPhaseId === phase.id)` and just render the normal block.
// Wait, to be safe, changing `onClick={() => handleEditPhaseStart(phase)}` to `setSettingsPhaseId` is enough.
// The user can't trigger inline editing anymore. 

fs.writeFileSync(pmFile, pmCode);

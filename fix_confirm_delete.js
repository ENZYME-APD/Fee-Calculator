const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

// 1. Import ConfirmModal
if (!docCode.includes('ConfirmModal')) {
  docCode = docCode.replace(
    "import { PromptModal } from '@/components/modals/PromptModal';",
    "import { PromptModal } from '@/components/modals/PromptModal';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
  );
}

// 2. Add state
const stateCode = `
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
`;
if (!docCode.includes('confirmDeleteTemplateId')) {
  docCode = docCode.replace(
    '  const [activeDragId, setActiveDragId] = useState<string | null>(null);',
    '  const [activeDragId, setActiveDragId] = useState<string | null>(null);\n' + stateCode
  );
}

// 3. Rewrite handleDeleteTemplate
const oldHandleDelete = `  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
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
  };`;

const newHandleDelete = `  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
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
  };`;

if (docCode.includes(oldHandleDelete)) {
  docCode = docCode.replace(oldHandleDelete, newHandleDelete);
} else {
    console.log("Could not find old handleDeleteTemplate");
}

// 4. Render ConfirmModal
const modalJSX = `      <ConfirmModal
        isOpen={!!confirmDeleteTemplateId}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmText="Delete"
        onConfirm={executeDeleteTemplate}
        onCancel={() => setConfirmDeleteTemplateId(null)}
      />
    </div>
    <DragOverlay>`;

if (!docCode.includes('<ConfirmModal')) {
  docCode = docCode.replace(
    '    </div>\n    <DragOverlay>',
    modalJSX
  );
}

fs.writeFileSync(docFile, docCode);

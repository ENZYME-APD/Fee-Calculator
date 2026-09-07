const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

// 1. Import PromptModal
if (!docCode.includes('PromptModal')) {
  docCode = docCode.replace(
    "import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';",
    "import { ProUpgradePrompt } from '@/components/ui/ProUpgradePrompt';\nimport { PromptModal } from '@/components/modals/PromptModal';"
  );
}

// 2. Add state
const stateCode = `
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
`;

if (!docCode.includes('promptConfig')) {
  docCode = docCode.replace(
    '  const [projects, setProjects] = useState<Project[]>([]);',
    stateCode + '\n  const [projects, setProjects] = useState<Project[]>([]);'
  );
}

// 3. Replace handleSaveTemplate
const oldHandle = `const handleSaveTemplate = async (block: DocumentBlock, currentContent: string, currentTitle: string) => {
    if (!dbCompany?.id) return;
    const name = window.prompt("Enter a name for this template:", currentTitle);
    if (!name) return;
    
    const newTemplate: Omit<SavedBlock, 'id'> = {
      companyId: dbCompany.id,
      templateName: name,
      type: block.type,
      title: currentTitle,
      content: currentContent
    };
    
    try {
      const id = await addSavedBlock(newTemplate);
      setSavedBlocks([...savedBlocks, { ...newTemplate, id }]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template saved successfully!' } }));
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to save template' } }));
    }
  };`;

const newHandle = `const handleSaveTemplate = (block: DocumentBlock, currentContent: string, currentTitle: string) => {
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
  };`;

if (docCode.includes(oldHandle)) {
  docCode = docCode.replace(oldHandle, newHandle);
}

// 4. Render the modal
const modalRender = `
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
}`;

if (!docCode.includes('<PromptModal')) {
  docCode = docCode.replace(
    '    </div>\n  );\n}',
    modalRender
  );
}

fs.writeFileSync(docFile, docCode);

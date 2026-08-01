import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/projects/ProjectManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add PromptModal import
content = content.replace(
  "import { ConfirmModal } from '@/components/modals/ConfirmModal';",
  "import { ConfirmModal } from '@/components/modals/ConfirmModal';\nimport { PromptModal } from '@/components/modals/PromptModal';"
);

// 2. Add promptConfig state
content = content.replace(
  `  const [confirmConfig, setConfirmConfig] = useState<{`,
  `  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    confirmText: string;
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    confirmText: '',
    onConfirm: () => {}
  });

  const [confirmConfig, setConfirmConfig] = useState<{`
);

// 3. Update handleSaveAsTemplate
content = content.replace(
  `  const handleSaveAsTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    const name = window.prompt("Enter a name for this template:", \`\${p.name} Template\`);
    if (name) {
      try {
        await duplicateProject(id, true, name, true);
        alert("Saved as template successfully! You can find it in Team Resources > Templates.");
      } catch(err) {
        alert("Failed to save template.");
      }
    }
  };`,
  `  const handleSaveAsTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    
    setPromptConfig({
      isOpen: true,
      title: 'Save as Template',
      message: 'Enter a name for this template:',
      defaultValue: \`\${p.name} Template\`,
      confirmText: 'Save Template',
      onConfirm: async (name: string) => {
        if (name.trim()) {
          try {
            await duplicateProject(id, true, name.trim(), true);
            alert("Saved as template successfully! You can find it in Team Resources > Templates.");
          } catch(err) {
            alert("Failed to save template.");
          }
        }
        setPromptConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };`
);

// 4. Add PromptModal to JSX
content = content.replace(
  `      <ConfirmModal
        isOpen={confirmConfig.isOpen}`,
  `      <PromptModal
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        message={promptConfig.message}
        defaultValue={promptConfig.defaultValue}
        confirmText={promptConfig.confirmText}
        onConfirm={promptConfig.onConfirm}
        onCancel={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated handleSaveAsTemplate in ProjectManager.tsx');

import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/projects/ProjectManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the type of confirmConfig to include secondaryAction
content = content.replace(
  `  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });`,
  `  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    secondaryAction?: {
      text: string;
      onClick: () => void;
    };
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });`
);

// 2. Update handleDuplicateProject
content = content.replace(
  `  const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const includeAllocations = window.confirm(
      "Duplicate this project exactly as is? \\n\\nClick 'OK' to keep all team members and project costs.\\nClick 'Cancel' to create a clean template with empty phases."
    );
    try {
      const newProjectId = await duplicateProject(id, includeAllocations);
      await loadProjects();
      setActiveProjectId(newProjectId);
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      alert("Failed to duplicate project");
    }
  };`,
  `  const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const performDuplicate = async (includeAllocations: boolean) => {
      try {
        const newProjectId = await duplicateProject(id, includeAllocations);
        await loadProjects();
        setActiveProjectId(newProjectId);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error("Failed to duplicate project:", error);
        alert("Failed to duplicate project");
      }
    };
    
    setConfirmConfig({
      isOpen: true,
      title: 'Duplicate Project',
      message: 'Do you want to duplicate this project exactly as is? You can keep all team members and project costs, or create a clean template with empty phases.',
      confirmText: 'Keep All',
      onConfirm: () => performDuplicate(true),
      secondaryAction: {
        text: 'Clean Template',
        onClick: () => performDuplicate(false)
      }
    });
  };`
);

// 3. Update the JSX component rendering
content = content.replace(
  `      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />`,
  `      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        secondaryAction={confirmConfig.secondaryAction}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated handleDuplicateProject in ProjectManager.tsx');

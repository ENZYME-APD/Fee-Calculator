import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/projects/ProjectManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add ConfirmModal import
content = content.replace(
  "import { Pencil, Trash2, ChevronUp, ChevronDown, Clock, Folder, Eraser, MoveRight } from 'lucide-react';",
  "import { Pencil, Trash2, ChevronUp, ChevronDown, Clock, Folder, Eraser, MoveRight } from 'lucide-react';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
);

// 2. Add confirmConfig state
content = content.replace(
  "const [editingPhaseDuration, setEditingPhaseDuration] = useState('');",
  `const [editingPhaseDuration, setEditingPhaseDuration] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<{
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
  });`
);

// 3. Update handleDeleteProject
content = content.replace(
  `  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      await deleteProject(id);
      if (activeProjectId === id) setActiveProjectId(null);
      loadProjects();
    }
  };`,
  `  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      confirmText: 'Delete Project',
      onConfirm: async () => {
        await deleteProject(id);
        if (activeProjectId === id) setActiveProjectId(null);
        loadProjects();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };`
);

// 4. Update handleDeletePhase
content = content.replace(
  `  const handleDeletePhase = async (id: string) => {
    if (confirm('Delete this phase entirely?')) {
      await deletePhase(id);
      loadPhases(activeProjectId!);
    }
  };`,
  `  const handleDeletePhase = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Phase',
      message: 'Are you sure you want to delete this phase entirely? All associated costs and resources will be lost.',
      confirmText: 'Delete Phase',
      onConfirm: async () => {
        await deletePhase(id);
        loadPhases(activeProjectId!);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };`
);

// 5. Update handleClearPhase
content = content.replace(
  `  const handleClearPhase = async (id: string) => {
    if (confirm('Clear all team members and costs from this phase?')) {
      await clearPhase(id);
      alert('Phase cleared successfully.');
    }
  };`,
  `  const handleClearPhase = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear Phase',
      message: 'Are you sure you want to clear all team members and costs from this phase?',
      confirmText: 'Clear Phase',
      onConfirm: async () => {
        await clearPhase(id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };`
);

// 6. Add ConfirmModal to JSX
content = content.replace(
  `        )}
      </div>
    </div>
  );
}`,
  `        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ProjectManager.tsx');

const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');
docCode = docCode.replace(
  "import { FileText, Download, Printer, Plus, LayoutTemplate, Folder } from 'lucide-react';",
  "import { FileText, Download, Printer, Plus, LayoutTemplate, Folder, Bookmark, Trash2 } from 'lucide-react';"
);
fs.writeFileSync(docFile, docCode);

const pmFile = 'src/components/projects/ProjectManager.tsx';
let pmCode = fs.readFileSync(pmFile, 'utf8');
if (!pmCode.includes('PhaseSettingsModal')) {
  pmCode = pmCode.replace(
    "import { ConfirmModal } from '@/components/modals/ConfirmModal';",
    "import { ConfirmModal } from '@/components/modals/ConfirmModal';\nimport { PhaseSettingsModal } from '@/components/modals/PhaseSettingsModal';"
  );
}
fs.writeFileSync(pmFile, pmCode);


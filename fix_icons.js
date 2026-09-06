const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { GripVertical, Trash2, FileText, Calculator, Users }')) {
  code = code.replace(
    "import { GripVertical, Trash2 } from 'lucide-react';",
    "import { GripVertical, Trash2, FileText, Calculator, Users } from 'lucide-react';"
  );
  fs.writeFileSync(file, code);
}

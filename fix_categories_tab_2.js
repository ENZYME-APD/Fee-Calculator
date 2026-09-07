const fs = require('fs');
const file = 'src/components/settings/CategoriesTab.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const [isSaving, setIsSaving] = useState(false);',
  'const [isSaving, setIsSaving] = useState(false);\n  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);'
);

fs.writeFileSync(file, code);

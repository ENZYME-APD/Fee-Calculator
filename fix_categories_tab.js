const fs = require('fs');
const file = 'src/components/settings/CategoriesTab.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import ConfirmModal
if (!code.includes('ConfirmModal')) {
  code = code.replace(
    "import { Tooltip } from '@/components/ui/Tooltip';",
    "import { Tooltip } from '@/components/ui/Tooltip';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
  );
}

// 2. Add state
if (!code.includes('confirmDeleteId')) {
  code = code.replace(
    'const [isSubmitting, setIsSubmitting] = useState(false);',
    'const [isSubmitting, setIsSubmitting] = useState(false);\n  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);'
  );
}

// 3. Replace handleDelete
const oldHandleDelete = `const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Team members with this category will show as uncategorized until updated.')) return;
    await deleteCategory(id);
    await loadCategories();
  };`;

const newHandleDelete = `const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteCategory(confirmDeleteId);
    await loadCategories();
    setConfirmDeleteId(null);
  };`;
code = code.replace(oldHandleDelete, newHandleDelete);

// 4. Render ConfirmModal
const modalJSX = `      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Category"
        message="Are you sure you want to delete this category? Team members with this category will show as uncategorized until updated."
        confirmText="Delete Category"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>`;
code = code.replace('    </div>\n  );\n}', modalJSX + '\n  );\n}');

fs.writeFileSync(file, code);

import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/projects/PaymentScheduleManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add ConfirmModal import
content = content.replace(
  "import { FileSpreadsheet, Plus, Trash2, Pencil, Check, X, CalendarDays, MoreVertical } from 'lucide-react';",
  "import { FileSpreadsheet, Plus, Trash2, Pencil, Check, X, CalendarDays, MoreVertical } from 'lucide-react';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
);

// 2. Add confirmConfig state
content = content.replace(
  "const [menuOpenId, setMenuOpenId] = useState<string | null>(null);",
  `const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
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

// 3. Update handleDelete
content = content.replace(
  `  const handleDelete = async (id: string) => {
    if (confirm('Delete this payment stage?')) {
      await deletePayment(id);
      await loadPayments();
    }
    setMenuOpenId(null);
  };`,
  `  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payment Stage',
      message: 'Are you sure you want to delete this payment stage? This action cannot be undone.',
      confirmText: 'Delete Payment',
      onConfirm: async () => {
        await deletePayment(id);
        await loadPayments();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
    setMenuOpenId(null);
  };`
);

// 4. Update handleUseTemplate
content = content.replace(
  `  const handleUseTemplate = async () => {
    if (payments.length > 0 && !confirm('This will replace your current payment schedule. Continue?')) return;
    
    await clearPayments(projectId);`,
  `  const handleUseTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);`
);

content = content.replace(
  `    await batchAddPayments(newPayments);
    await loadPayments();
  };

  const handleMonthlyTemplate = async () => {`,
  `    await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  const handleMonthlyTemplate = async () => {`
);

// 5. Update handleMonthlyTemplate
content = content.replace(
  `  const handleMonthlyTemplate = async () => {
    if (payments.length > 0 && !confirm('This will replace your current payment schedule. Continue?')) return;
    
    await clearPayments(projectId);`,
  `  const handleMonthlyTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);`
);

content = content.replace(
  `    await batchAddPayments(newPayments);
    await loadPayments();
  };

  const totalPercentage = payments.reduce`,
  `    await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  const totalPercentage = payments.reduce`
);

// 6. Add ConfirmModal to JSX
content = content.replace(
  `      </div>
    </div>
  );
}`,
  `      </div>
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
console.log('Successfully updated PaymentScheduleManager.tsx');

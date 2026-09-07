const fs = require('fs');
const file = 'src/components/settings/TeamTab.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import ConfirmModal
if (!code.includes('ConfirmModal')) {
  code = code.replace(
    "import { Tooltip } from '@/components/ui/Tooltip';",
    "import { Tooltip } from '@/components/ui/Tooltip';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
  );
}

// 2. Add state
if (!code.includes('confirmDeleteInviteId')) {
  code = code.replace(
    'const [copied, setCopied] = useState<string | null>(null);',
    'const [copied, setCopied] = useState<string | null>(null);\n  const [confirmDeleteInviteId, setConfirmDeleteInviteId] = useState<string | null>(null);\n  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | null>(null);'
  );
}

// 3. Replace handleDelete (Invite)
const oldHandleDelete = `const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;
    await deleteInvite(id);
    await loadData();
  };`;

const newHandleDelete = `const handleDelete = (id: string) => {
    setConfirmDeleteInviteId(id);
  };

  const executeDeleteInvite = async () => {
    if (!confirmDeleteInviteId) return;
    await deleteInvite(confirmDeleteInviteId);
    await loadData();
    setConfirmDeleteInviteId(null);
  };`;

code = code.replace(oldHandleDelete, newHandleDelete);

// 4. Replace handleDeleteUser
const oldHandleDeleteUser = `const handleDeleteUser = async (uid: string) => {
    if (uid === dbUser?.uid) {
      alert("You cannot remove yourself from the company.");
      return;
    }
    if (!confirm('Are you sure you want to remove this user from the company?')) return;
    await removeUserFromCompany(uid);
    await loadData();
  };`;

const newHandleDeleteUser = `const handleDeleteUser = (uid: string) => {
    if (uid === dbUser?.uid) {
      alert("You cannot remove yourself from the company.");
      return;
    }
    setConfirmRemoveUserId(uid);
  };

  const executeRemoveUser = async () => {
    if (!confirmRemoveUserId) return;
    await removeUserFromCompany(confirmRemoveUserId);
    await loadData();
    setConfirmRemoveUserId(null);
  };`;

code = code.replace(oldHandleDeleteUser, newHandleDeleteUser);

// 5. Render ConfirmModals
const modalJSX = `      <ConfirmModal
        isOpen={!!confirmDeleteInviteId}
        title="Revoke Invite"
        message="Are you sure you want to revoke this invite? The link will no longer work."
        confirmText="Revoke Invite"
        onConfirm={executeDeleteInvite}
        onCancel={() => setConfirmDeleteInviteId(null)}
      />
      <ConfirmModal
        isOpen={!!confirmRemoveUserId}
        title="Remove User"
        message="Are you sure you want to remove this user from the company? They will lose access to all company projects and data."
        confirmText="Remove User"
        onConfirm={executeRemoveUser}
        onCancel={() => setConfirmRemoveUserId(null)}
      />
    </div>`;
code = code.replace('    </div>\n  );\n}', modalJSX + '\n  );\n}');

fs.writeFileSync(file, code);

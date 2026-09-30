const fs = require('fs');
const file = 'src/app/(app)/superadmin/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure ConfirmModal is imported
if (!code.includes('ConfirmModal')) {
  code = code.replace(
    /import { Company, User } from '@\/lib\/firebase\/schema';/,
    "import { Company, User } from '@/lib/firebase/schema';\nimport { ConfirmModal } from '@/components/modals/ConfirmModal';"
  );
}

// Add state for modal
if (!code.includes('confirmConfig')) {
  code = code.replace(
    /const \[isUpdating, setIsUpdating\] = useState<string \| null>\(null\);/,
    "const [isUpdating, setIsUpdating] = useState<string | null>(null);\n  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });"
  );
}

// Update handlers to use setConfirmConfig
code = code.replace(
  /if \(!window\.confirm\("Grant lifetime access\?"\)\) return;\n\s*setIsUpdating\(companyId\);\n\s*try \{\n\s*await updateCompany\(companyId, \{ subscriptionStatus: 'lifetime', tier: 'pro' \}\);\n\s*setCompanies\(prev => prev\.map\(c => c\.id === companyId \? \{ \.\.\.c, subscriptionStatus: 'lifetime', tier: 'pro' \} : c\)\);\n\s*\} catch \(err: any\) \{\n\s*alert\("Failed to set lifetime: " \+ err\.message\);\n\s*\} finally \{\n\s*setIsUpdating\(null\);\n\s*\}/g,
  `setConfirmConfig({
      isOpen: true,
      title: 'Grant Lifetime Access',
      message: 'Are you sure you want to grant lifetime PRO access to this company?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsUpdating(companyId);
        try {
          await updateCompany(companyId, { subscriptionStatus: 'lifetime', tier: 'pro' });
          setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'lifetime', tier: 'pro' } : c));
        } catch (err: any) {
          setError("Failed to set lifetime: " + err.message);
        } finally {
          setIsUpdating(null);
        }
      }
    });`
);

code = code.replace(
  /if \(!window\.confirm\("Revoke access\?"\)\) return;\n\s*setIsUpdating\(companyId\);\n\s*try \{\n\s*await updateCompany\(companyId, \{ subscriptionStatus: 'canceled', tier: 'free' \}\);\n\s*setCompanies\(prev => prev\.map\(c => c\.id === companyId \? \{ \.\.\.c, subscriptionStatus: 'canceled', tier: 'free' as any \} : c\)\);\n\s*\} catch \(err: any\) \{\n\s*alert\("Failed to revoke access: " \+ err\.message\);\n\s*\} finally \{\n\s*setIsUpdating\(null\);\n\s*\}/g,
  `setConfirmConfig({
      isOpen: true,
      title: 'Revoke Access',
      message: 'Are you sure you want to revoke access? This will lock the company out of PRO features.',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsUpdating(companyId);
        try {
          await updateCompany(companyId, { subscriptionStatus: 'canceled', tier: 'free' });
          setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'canceled', tier: 'free' as any } : c));
        } catch (err: any) {
          setError("Failed to revoke access: " + err.message);
        } finally {
          setIsUpdating(null);
        }
      }
    });`
);

code = code.replace(
  /alert\("Failed to extend trial: " \+ err\.message\);/g,
  `setError("Failed to extend trial: " + err.message);`
);

// Add the ConfirmModal to the JSX
if (!code.includes('<ConfirmModal')) {
  code = code.replace(
    /<\/div>\n\s*<\/div>\n\s*\);\n\}/,
    `    </div>\n        <ConfirmModal\n          isOpen={confirmConfig.isOpen}\n          title={confirmConfig.title}\n          message={confirmConfig.message}\n          onConfirm={confirmConfig.onConfirm}\n          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}\n        />\n      </div>\n    </div>\n  );\n}`
  );
}

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/app/(app)/superadmin/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure updateCompany is imported from '@/lib/firebase/db'
if (!code.includes('updateCompany')) {
  code = code.replace(
    /import { getAllCompaniesForSuperadmin, getAllUsersForSuperadmin } from '@\/lib\/firebase\/db';/,
    "import { getAllCompaniesForSuperadmin, getAllUsersForSuperadmin, updateCompany } from '@/lib/firebase/db';"
  );
}

// Add state for updating UI
if (!code.includes('isUpdating')) {
  code = code.replace(
    /const \[error, setError\] = useState<string \| null>\(null\);/,
    "const [error, setError] = useState<string | null>(null);\n  const [isUpdating, setIsUpdating] = useState<string | null>(null);"
  );
}

// Add helper functions
const functions = `
  const handleExtendTrial = async (companyId: string) => {
    setIsUpdating(companyId);
    try {
      const newEndsAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
      await updateCompany(companyId, { subscriptionStatus: 'trialing', trialEndsAt: newEndsAt, tier: 'pro' });
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'trialing', trialEndsAt: newEndsAt, tier: 'pro' } : c));
    } catch (err: any) {
      alert("Failed to extend trial: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSetLifetime = async (companyId: string) => {
    if (!window.confirm("Grant lifetime access?")) return;
    setIsUpdating(companyId);
    try {
      await updateCompany(companyId, { subscriptionStatus: 'lifetime', tier: 'pro' });
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'lifetime', tier: 'pro' } : c));
    } catch (err: any) {
      alert("Failed to set lifetime: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRevoke = async (companyId: string) => {
    if (!window.confirm("Revoke access?")) return;
    setIsUpdating(companyId);
    try {
      await updateCompany(companyId, { subscriptionStatus: 'revoked', tier: 'free' });
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, subscriptionStatus: 'revoked', tier: 'free' } : c));
    } catch (err: any) {
      alert("Failed to revoke access: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };
`;

if (!code.includes('handleExtendTrial')) {
  code = code.replace(
    /return \(\s*<div className="flex-1 overflow-y-auto bg-slate-50/,
    `${functions}\n  return (\n    <div className="flex-1 overflow-y-auto bg-slate-50`
  );
}

// Add Actions column header
code = code.replace(
  /<th className="px-6 py-4">Users<\/th>/,
  '<th className="px-6 py-4">Users</th>\n                  <th className="px-6 py-4 text-right">Actions</th>'
);

// Add Actions column cell
const actionsCell = `
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleExtendTrial(company.id)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Add 14 days"
                          >
                            +14d Trial
                          </button>
                          <button
                            onClick={() => handleSetLifetime(company.id)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Grant Lifetime Access"
                          >
                            Lifetime
                          </button>
                          <button
                            onClick={() => handleRevoke(company.id)}
                            disabled={isUpdating === company.id}
                            className="text-xs px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded font-medium disabled:opacity-50 transition-colors"
                            title="Revoke License"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
`;

// Add group class to tr
code = code.replace(
  /<tr key=\{company\.id\} className="hover:bg-slate-50 dark:hover:bg-slate-800\/50 transition-colors">/g,
  '<tr key={company.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">'
);

if (!code.includes('Actions</th>')) {
   // Already done above maybe? Wait, string replacement is single match if global not used
}

// Replace the users td closing tag with users td closing tag + actions cell
code = code.replace(
  /<\/td>\s*<\/tr>/,
  `</td>${actionsCell}\n                    </tr>`
);

// We need to use regex with global flag to match all </tr> if there was a map?
// Wait, replacing `</td>\n                    </tr>` might only replace the first occurrence!
// Let's use a split and join.

let newCode = code.split('</td>\n                    </tr>').join('</td>\n' + actionsCell + '                    </tr>');
// Wait, the No companies found tr also has </tr>!
// But `</td>\n                    </tr>` will match the user's td.
// Let's refine the replacement!

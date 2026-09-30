const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. In useMemo (chart Data)
const oldUseMemoCheck = `      const categoryName = teamCategories.find(c => c.id === cat)?.name || 'Uncategorized';
      if (!showConsultants && categoryName.toLowerCase().includes('consultant')) {
        return; // skip external consultants from non-billable overheads if hidden
      }`;
const newUseMemoCheck = `      const categoryObj = teamCategories.find(c => c.id === cat);
      const isExternal = categoryObj?.type === 'external';
      if (!showConsultants && isExternal) {
        return; // skip external team members from non-billable overheads if hidden
      }`;
code = code.replace(oldUseMemoCheck, newUseMemoCheck);

// 2. In performSync
const oldSyncCheck = `      const coreMembers = members.filter(m => {
        const catName = teamCategories.find(c => c.id === m.category)?.name || '';
        return !catName.toLowerCase().includes('consultant');
      });`;
const newSyncCheck = `      const coreMembers = members.filter(m => {
        const categoryObj = teamCategories.find(c => c.id === m.category);
        return categoryObj?.type !== 'external';
      });`;
code = code.replace(oldSyncCheck, newSyncCheck);

// 3. In rendering the non-billable table groups
const oldRenderCheck = `                        const categoryName = teamCategories.find(c => c.id === categoryId)?.name || 'Uncategorized';
                        if (!showConsultants && categoryName.toLowerCase().includes('consultant')) {
                          return null;
                        }`;
const newRenderCheck = `                        const categoryObj = teamCategories.find(c => c.id === categoryId);
                        const isExternal = categoryObj?.type === 'external';
                        if (!showConsultants && isExternal) {
                          return null;
                        }`;
code = code.replace(oldRenderCheck, newRenderCheck);

fs.writeFileSync(file, code);

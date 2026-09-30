const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldSync = `      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      const monthlyOverheadTotal = totalYearlyOverhead / 12;
      const activeMembers = members.filter(m => !m.isOverheadsManuallyOverridden);
      
      if (activeMembers.length > 0) {
        const overheadPerPerson = monthlyOverheadTotal / members.length;`;

const newSync = `      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      const monthlyOverheadTotal = totalYearlyOverhead / 12;
      
      const coreMembers = members.filter(m => {
        const catName = teamCategories.find(c => c.id === m.category)?.name || '';
        return !catName.toLowerCase().includes('consultant');
      });

      const activeMembers = coreMembers.filter(m => !m.isOverheadsManuallyOverridden);
      
      if (activeMembers.length > 0) {
        const overheadPerPerson = monthlyOverheadTotal / coreMembers.length;`;

code = code.replace(oldSync, newSync);
fs.writeFileSync(file, code);

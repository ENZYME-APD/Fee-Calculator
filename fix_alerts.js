const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure ConfirmModal is imported
if (!code.includes('ConfirmModal')) {
  code = code.replace(
    'import { Tooltip } from \'@/components/ui/Tooltip\';',
    'import { Tooltip } from \'@/components/ui/Tooltip\';\nimport { ConfirmModal } from \'@/components/modals/ConfirmModal\';'
  );
}

// Add state for ConfirmModal
if (!code.includes('const [confirmConfig')) {
  code = code.replace(
    'const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});',
    `const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});\n  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, action: () => void}>({ isOpen: false, title: '', message: '', action: () => {} });`
  );
}

// Modify handleSyncToTeam
const oldSync = `  const handleSyncToTeam = async () => {
    if (!confirm('This will update the overheads for all team members who are not manually overridden. Proceed?')) return;
    setSyncing(true);
    try {
      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      const monthlyOverheadTotal = totalYearlyOverhead / 12;
      const activeMembers = members.filter(m => !m.isOverheadsManuallyOverridden);
      
      if (activeMembers.length > 0) {
        const overheadPerPerson = monthlyOverheadTotal / members.length;
        
        await Promise.all(activeMembers.map(m => {
          const baseCost = (m.salary + Math.round(overheadPerPerson)) / 160;
          return updateTeamMember(m.id!, { overheads: Math.round(overheadPerPerson), costPerHour: baseCost });
        }));
        const mems = await getTeamMembers();
        setMembers(mems);
        alert('Successfully synced calculated overheads to your team!');
      }
    } catch(e) {
      console.error(e);
      alert('Error syncing overheads');
    } finally {
      setSyncing(false);
    }
  };`;

const newSync = `  const performSync = async () => {
    setSyncing(true);
    try {
      const totalYearlyOverhead = computedStats.totalOverheadsYearly;
      const monthlyOverheadTotal = totalYearlyOverhead / 12;
      const activeMembers = members.filter(m => !m.isOverheadsManuallyOverridden);
      
      if (activeMembers.length > 0) {
        const overheadPerPerson = monthlyOverheadTotal / members.length;
        
        await Promise.all(activeMembers.map(m => {
          const baseCost = (m.salary + Math.round(overheadPerPerson)) / 160;
          return updateTeamMember(m.id!, { overheads: Math.round(overheadPerPerson), costPerHour: baseCost });
        }));
        const mems = await getTeamMembers();
        setMembers(mems);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Successfully synced overheads to team' } }));
      }
    } catch(e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Error syncing overheads' } }));
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncToTeam = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Sync Overheads',
      message: 'This will update the overheads for all team members who are not manually overridden. Proceed?',
      action: performSync
    });
  };`;

code = code.replace(oldSync, newSync);

// Modify handleSeedMyData
const oldSeed = `  const handleSeedMyData = async () => {
    if (!confirm('Seed your specific data?')) return;
    const myCategories = [`;

const newSeed = `  const performSeed = async () => {
    const myCategories = [`;

code = code.replace(oldSeed, newSeed);

const oldSeedEnd = `      await updateOverheadsProfile({
        yearlyIncomeTarget: 1000000,
        workingHoursPerYear: 1832,
        categories: myCategories
      });
      alert('Data seeded! You can remove this button now.');
    } catch(e) {}
  };`;

const newSeedEnd = `      await updateOverheadsProfile({
        yearlyIncomeTarget: 1000000,
        workingHoursPerYear: 1832,
        categories: myCategories
      });
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Data seeded! You can remove this button now.' } }));
    } catch(e) {}
  };

  const handleSeedMyData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Seed My Data',
      message: 'Seed your specific data?',
      action: performSeed
    });
  };`;

code = code.replace(oldSeedEnd, newSeedEnd);

// Replace save profile alert if it exists
if (code.includes('alert(')) {
  code = code.replace(/alert\((['"`])(.+?)\1\)/g, "window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '$2' } }))");
}

// Add ConfirmModal to JSX
const jsxModal = `
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
`;

code = code.replace(`    </div>\n  );\n}`, jsxModal);

fs.writeFileSync(file, code);

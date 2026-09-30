const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const importDataStr = `
  const handleSeedMyData = async () => {
    if (!confirm('Seed your specific data?')) return;
    const myCategories = [
      { id: 'cat-1', name: 'Consultants & Corp', items: [
        { id: 'item-1-1', name: 'Ada', yearlyCost: 2000, isActive: true },
        { id: 'item-1-2', name: 'Auditors HK', yearlyCost: 2000, isActive: true },
        { id: 'item-1-3', name: 'Auditors SG', yearlyCost: 2000, isActive: true },
        { id: 'item-1-4', name: 'Domenec', yearlyCost: 5000, isActive: true },
        { id: 'item-1-5', name: 'Finance (Kath)', yearlyCost: 20000, isActive: true },
        { id: 'item-1-6', name: 'Enkindle', yearlyCost: 2000, isActive: true },
        { id: 'item-1-7', name: 'Comp. Sec India', yearlyCost: 2000, isActive: true }
      ]},
      { id: 'cat-2', name: 'Marketing & BD', items: [
        { id: 'item-2-1', name: 'Budgets trips Jorge B', yearlyCost: 0, isActive: false },
        { id: 'item-2-2', name: 'Budgets trips Jorge G', yearlyCost: 0, isActive: false },
        { id: 'item-2-3', name: 'Budgets trips Marcelo', yearlyCost: 5000, isActive: true },
        { id: 'item-2-4', name: 'Budgets trips Simon', yearlyCost: 0, isActive: false },
        { id: 'item-2-5', name: 'Budgets Trips Eugenio', yearlyCost: 0, isActive: false },
        { id: 'item-2-6', name: 'Conferece & Events', yearlyCost: 2000, isActive: true }
      ]},
      { id: 'cat-3', name: 'IT & Software', items: [
        { id: 'item-3-1', name: 'Dropbox', yearlyCost: 2340, isActive: true },
        { id: 'item-3-2', name: 'Google', yearlyCost: 4320, isActive: true },
        { id: 'item-3-3', name: 'Magnific', yearlyCost: 1000, isActive: true },
        { id: 'item-3-4', name: 'Archicad', yearlyCost: 4000, isActive: true },
        { id: 'item-3-5', name: 'Rhino', yearlyCost: 0, isActive: false },
        { id: 'item-3-6', name: 'Microsoft', yearlyCost: 240, isActive: true },
        { id: 'item-3-7', name: 'Airtable', yearlyCost: 480, isActive: true },
        { id: 'item-3-8', name: 'Softr (Web)', yearlyCost: 1668, isActive: true },
        { id: 'item-3-9', name: 'Parallels', yearlyCost: 140, isActive: true },
        { id: 'item-3-10', name: 'Gendo', yearlyCost: 1000, isActive: true },
        { id: 'item-3-11', name: 'Speckle', yearlyCost: 0, isActive: false },
        { id: 'item-3-12', name: 'n8n', yearlyCost: 240, isActive: true },
        { id: 'item-3-13', name: 'MIRO', yearlyCost: 576, isActive: true },
        { id: 'item-3-14', name: 'XERO', yearlyCost: 1900, isActive: true },
        { id: 'item-3-15', name: 'Computers 1', yearlyCost: 0, isActive: false },
        { id: 'item-3-16', name: 'Computers 2', yearlyCost: 0, isActive: false },
        { id: 'item-3-17', name: 'Computers 3', yearlyCost: 0, isActive: false },
        { id: 'item-3-18', name: 'Computers 4', yearlyCost: 0, isActive: false }
      ]},
      { id: 'cat-4', name: 'Office & Others', items: [
        { id: 'item-4-1', name: 'memberships EF', yearlyCost: 0, isActive: false },
        { id: 'item-4-2', name: 'memberships JB', yearlyCost: 0, isActive: false },
        { id: 'item-4-3', name: 'memberships JG', yearlyCost: 0, isActive: false },
        { id: 'item-4-4', name: 'memberships MM', yearlyCost: 0, isActive: false },
        { id: 'item-4-5', name: 'memberships SN', yearlyCost: 0, isActive: false },
        { id: 'item-4-6', name: 'Office Expenses Madrid', yearlyCost: 6000, isActive: true },
        { id: 'item-4-7', name: 'Office Expenses Porto', yearlyCost: 0, isActive: false },
        { id: 'item-4-8', name: 'Office expense Jakarta', yearlyCost: 7200, isActive: true },
        { id: 'item-4-9', name: 'Office Expense SG', yearlyCost: 0, isActive: false },
        { id: 'item-4-10', name: 'Insurance JB', yearlyCost: 1250, isActive: true },
        { id: 'item-4-11', name: 'Insurance JG', yearlyCost: 1250, isActive: true },
        { id: 'item-4-12', name: 'Insurance MM', yearlyCost: 1250, isActive: true },
        { id: 'item-4-13', name: 'Insurance EF', yearlyCost: 0, isActive: false },
        { id: 'item-4-14', name: 'Insurance SN', yearlyCost: 0, isActive: false },
        { id: 'item-4-15', name: 'Insurance MC', yearlyCost: 0, isActive: false },
        { id: 'item-4-16', name: 'Insurance BS', yearlyCost: 0, isActive: false },
        { id: 'item-4-17', name: 'Insurance HT', yearlyCost: 600, isActive: true }
      ]}
    ];
    setCategories(myCategories);
    try {
      await updateOverheadsProfile({
        yearlyIncomeTarget: 1000000,
        workingHoursPerYear: 1832,
        categories: myCategories
      });
      alert('Data seeded! You can remove this button now.');
    } catch(e) {}
  };
`;

code = code.replace('const handleExportCSV = () => {', importDataStr + '\n  const handleExportCSV = () => {');

const buttonStr = `
            {user?.email === 'j.beneitez@weareenzyme.com' && (
              <button 
                onClick={handleSeedMyData}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all"
              >
                Seed My Excel Data
              </button>
            )}
`;

code = code.replace('<button \n              onClick={() => fileInputRef.current?.click()}', buttonStr + '<button \n              onClick={() => fileInputRef.current?.click()}');

fs.writeFileSync(file, code);

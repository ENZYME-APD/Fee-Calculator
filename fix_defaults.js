const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldDefaults = `const DEFAULT_CATEGORIES: OverheadCategory[] = [
  { id: 'cat-1', name: 'Consultants & Corp', items: [] },
  { id: 'cat-2', name: 'Marketing & BD', items: [] },
  { id: 'cat-3', name: 'IT & Software', items: [] },
  { id: 'cat-4', name: 'Office & Others', items: [] }
];`;

const newDefaults = `const DEFAULT_CATEGORIES: OverheadCategory[] = [
  { id: 'cat-1', name: 'Consultants & Corp', items: [
    { id: 'item-1-1', name: 'Ada', yearlyCost: 0, isActive: true },
    { id: 'item-1-2', name: 'Auditors HK', yearlyCost: 0, isActive: true },
    { id: 'item-1-3', name: 'Auditors SG', yearlyCost: 0, isActive: true },
    { id: 'item-1-4', name: 'Domenec', yearlyCost: 0, isActive: true },
    { id: 'item-1-5', name: 'Finance', yearlyCost: 0, isActive: true },
    { id: 'item-1-6', name: 'Enkindle', yearlyCost: 0, isActive: true },
    { id: 'item-1-7', name: 'Comp. Sec India', yearlyCost: 0, isActive: true }
  ]},
  { id: 'cat-2', name: 'Marketing & BD', items: [
    { id: 'item-2-1', name: 'Trips Budget', yearlyCost: 0, isActive: true },
    { id: 'item-2-2', name: 'Conferences & Events', yearlyCost: 0, isActive: true }
  ]},
  { id: 'cat-3', name: 'IT & Software', items: [
    { id: 'item-3-1', name: 'Dropbox', yearlyCost: 0, isActive: true },
    { id: 'item-3-2', name: 'Google Workspace', yearlyCost: 0, isActive: true },
    { id: 'item-3-3', name: 'Magnific', yearlyCost: 0, isActive: true },
    { id: 'item-3-4', name: 'Archicad', yearlyCost: 0, isActive: true },
    { id: 'item-3-5', name: 'Rhino', yearlyCost: 0, isActive: true },
    { id: 'item-3-6', name: 'Microsoft', yearlyCost: 0, isActive: true },
    { id: 'item-3-7', name: 'Airtable', yearlyCost: 0, isActive: true },
    { id: 'item-3-8', name: 'Website Hosting', yearlyCost: 0, isActive: true },
    { id: 'item-3-9', name: 'Parallels', yearlyCost: 0, isActive: true },
    { id: 'item-3-10', name: 'Gendo', yearlyCost: 0, isActive: true },
    { id: 'item-3-11', name: 'Speckle', yearlyCost: 0, isActive: true },
    { id: 'item-3-12', name: 'Automation (n8n, Zapier)', yearlyCost: 0, isActive: true },
    { id: 'item-3-13', name: 'MIRO', yearlyCost: 0, isActive: true },
    { id: 'item-3-14', name: 'XERO', yearlyCost: 0, isActive: true },
    { id: 'item-3-15', name: 'Hardware Depreciation', yearlyCost: 0, isActive: true }
  ]},
  { id: 'cat-4', name: 'Office & Others', items: [
    { id: 'item-4-1', name: 'Memberships (ARB, etc)', yearlyCost: 0, isActive: true },
    { id: 'item-4-2', name: 'Office Rent / Expenses', yearlyCost: 0, isActive: true },
    { id: 'item-4-3', name: 'Health Insurance', yearlyCost: 0, isActive: true },
    { id: 'item-4-4', name: 'Business Insurance', yearlyCost: 0, isActive: true }
  ]}
];`;

code = code.replace(oldDefaults, newDefaults);
fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/lib/firebase/schema.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'nonBillablePercentage?: number;',
  'nonBillablePercentage?: number;\n  nonBillableDescription?: string;'
);

fs.writeFileSync(file, code);

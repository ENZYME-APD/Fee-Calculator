const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/z-10 print:hidden flex items-center/g, 'z-50 print:hidden flex items-center');

fs.writeFileSync(file, code);

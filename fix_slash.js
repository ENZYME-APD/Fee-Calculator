const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

// The file currently has "$\\{" which in source code is literally dollar, backslash, open brace
code = code.replace(/\$\\\{/g, '${');

fs.writeFileSync(file, code);

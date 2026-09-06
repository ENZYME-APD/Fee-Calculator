const fs = require('fs');

function addUseClient(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.startsWith('"use client";')) {
    fs.writeFileSync(file, '"use client";\n' + code);
  }
}

addUseClient('src/components/documents/DocumentBuilder.tsx');
addUseClient('src/components/documents/SortableBlock.tsx');

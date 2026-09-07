const fs = require('fs');

const schemaFile = 'src/lib/firebase/schema.ts';
let code = fs.readFileSync(schemaFile, 'utf8');

code = code.replace(
  '  description: string;\n  durationWeeks: number;',
  '  description: string;\n  tasks?: string;\n  inclusions?: string;\n  omissions?: string;\n  deliverables?: string;\n  durationWeeks: number;'
);

fs.writeFileSync(schemaFile, code);

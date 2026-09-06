const fs = require('fs');
const file = 'src/components/wiki/WikiContent.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<FileText, Download className=',
  '<FileText className='
);

// Wait, the import replace was: code = code.replace('FileText', 'FileText, Download');
// It replaced the first occurrence which was the component tag.
// Let's make sure the import is correct.
code = code.replace(
  'CalendarCheck,\n  FileText, Download,\n  Download,',
  'CalendarCheck,\n  FileText,\n  Download,\n  ShieldAlert,'
);

// Actually let's just make sure ShieldAlert is imported
if (!code.includes('ShieldAlert,')) {
  code = code.replace('import {', 'import { ShieldAlert,');
}

fs.writeFileSync(file, code);

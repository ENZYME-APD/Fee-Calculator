const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const newLines = [...lines.slice(0, 498), ...lines.slice(518)];
fs.writeFileSync(file, newLines.join('\n'));

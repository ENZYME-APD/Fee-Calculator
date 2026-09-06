const fs = require('fs');
const file = 'src/lib/utils/docxExport.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'new Paragraph({ text: "Phase", bold: true })',
  'new Paragraph({ children: [new TextRun({ text: "Phase", bold: true })] })'
);
code = code.replace(
  'new Paragraph({ text: "Duration", bold: true })',
  'new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })'
);
code = code.replace(
  'new Paragraph({ text: "Cost", bold: true })',
  'new Paragraph({ children: [new TextRun({ text: "Cost", bold: true })] })'
);
code = code.replace(
  'new Paragraph({ text: "Total Fee", bold: true })',
  'new Paragraph({ children: [new TextRun({ text: "Total Fee", bold: true })] })'
);
code = code.replace(
  /new Paragraph\(\{ text: `\$(\S+)`, bold: true \}\)/g,
  'new Paragraph({ children: [new TextRun({ text: "$$1", bold: true })] })'
);

fs.writeFileSync(file, code);

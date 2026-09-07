const fs = require('fs');

const cssFile = 'src/app/globals.css';
let cssCode = fs.readFileSync(cssFile, 'utf8');

cssCode = cssCode.replace(/@media print \{[\s\S]*?\}/, `
@media print {
  html, body {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
  }
  
  .h-full, .h-screen, .max-h-full, .max-h-screen, .overflow-hidden, .overflow-y-auto, .overflow-y-scroll {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
}
`.trim());

fs.writeFileSync(cssFile, cssCode);

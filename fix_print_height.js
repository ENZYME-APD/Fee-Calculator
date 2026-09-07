const fs = require('fs');

const cssFile = 'src/app/globals.css';
let cssCode = fs.readFileSync(cssFile, 'utf8');

const printStyles = `
@media print {
  html, body {
    height: auto !important;
    overflow: visible !important;
  }
  
  /* Force all height/scroll containers to expand fully in print mode */
  div, main, section {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
}
`;

if (!cssCode.includes('@media print')) {
  cssCode += '\n' + printStyles;
  fs.writeFileSync(cssFile, cssCode);
}

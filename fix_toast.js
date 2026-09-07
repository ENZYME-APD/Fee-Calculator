const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

docCode = docCode.replace("import toast from 'react-hot-toast';", "");
docCode = docCode.replace(/toast\.success\((.*?)\)/g, "window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: $1 } }))");
docCode = docCode.replace(/toast\.error\((.*?)\)/g, "window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: $1 } }))");

fs.writeFileSync(docFile, docCode);

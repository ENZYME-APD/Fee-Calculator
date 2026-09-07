const fs = require('fs');

// 1. Fix db.ts
const dbFile = 'src/lib/firebase/db.ts';
let dbCode = fs.readFileSync(dbFile, 'utf8');
dbCode = dbCode.replace(', SavedBlock } from \'firebase/firestore\';', '} from \'firebase/firestore\';');
dbCode = dbCode.replace(
  "from './schema';",
  ", SavedBlock } from './schema';"
);
fs.writeFileSync(dbFile, dbCode);

// 2. Fix DocumentBuilder.tsx
const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

// Import toast if not there
if (!docCode.includes('import toast from \'react-hot-toast\';')) {
  docCode = docCode.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport toast from 'react-hot-toast';"
  );
}

// Pass onSaveTemplate
docCode = docCode.replace(
  '<SortableBlock ',
  '<SortableBlock \n                        onSaveTemplate={handleSaveTemplate}'
);

fs.writeFileSync(docFile, docCode);

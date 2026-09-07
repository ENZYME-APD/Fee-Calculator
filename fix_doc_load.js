const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

docCode = docCode.replace(
  "const [projs, m, c, a, pCosts] = await Promise.all([",
  "const [projs, m, c, a, pCosts, saved] = await Promise.all(["
);

docCode = docCode.replace(
  "      getProjectCosts()",
  "      getProjectCosts(),\n      getSavedBlocks(dbCompany!.id!)"
);

docCode = docCode.replace(
  "    setCosts(pCosts);",
  "    setCosts(pCosts);\n    setSavedBlocks(saved);"
);

fs.writeFileSync(docFile, docCode);

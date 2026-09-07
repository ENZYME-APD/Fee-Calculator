const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

docCode = docCode.replace(/companyId: dbCompany\.id!,\n      companyId: dbCompany\.id,\n      projectId: activeProjectId,/g, "companyId: dbCompany.id!,\n      projectId: activeProjectId,");
docCode = docCode.replace(/companyId: dbCompany\.id,\n      companyId: dbCompany\.id,\n      projectId: activeProjectId,/g, "companyId: dbCompany.id!,\n      projectId: activeProjectId,");

fs.writeFileSync(docFile, docCode);

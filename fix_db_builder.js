const fs = require('fs');
const file = 'src/components/documents/DocumentBuilder.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('getTeamCategories', 'getCategories');
code = code.replace('getAllocations()', 'getAllocations(dbCompany!.id!)');
code = code.replace('getProjectCosts(dbCompany!.id!)', 'getProjectCosts()');

fs.writeFileSync(file, code);

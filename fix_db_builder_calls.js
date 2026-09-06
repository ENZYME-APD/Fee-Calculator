const fs = require('fs');
const file = 'src/components/documents/DocumentBuilder.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/getTeamMembers\(dbCompany!\.id!\)/, 'getTeamMembers()');
code = code.replace(/getTeamCategories\(dbCompany!\.id!\)/, 'getCategories()');
code = code.replace(/getAllocations\(dbCompany!\.id!\)/, 'getAllocations()');
code = code.replace(/getProjects\(dbCompany!\.id!\)/, 'getProjects()');
code = code.replace('getTeamCategories', 'getCategories');

fs.writeFileSync(file, code);

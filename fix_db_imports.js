const fs = require('fs');
const file = 'src/lib/firebase/db.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { Company, User, Invite, TeamCategory, TeamMember, Project, Phase, Allocation, ProjectCost, Payment, ProjectTask } from './schema';",
  "import { Company, User, Invite, TeamCategory, TeamMember, Project, Phase, Allocation, ProjectCost, Payment, ProjectTask, DocumentBlock } from './schema';"
);

fs.writeFileSync(file, code);

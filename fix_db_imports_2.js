const fs = require('fs');
const file = 'src/lib/firebase/db.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { TeamMember, Project, Phase, Allocation, ProjectCost, Payment, Invite, TeamCategory, User, ProjectTask } from './schema';",
  "import { TeamMember, Project, Phase, Allocation, ProjectCost, Payment, Invite, TeamCategory, User, ProjectTask, DocumentBlock } from './schema';"
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '}, [members, categories, workingHoursPerYear, yearlyIncomeTarget]);',
  '}, [members, categories, workingHoursPerYear, yearlyIncomeTarget, showConsultants, teamCategories]);'
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/resources/TeamMemberForm.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace value checks that convert 0 to '' for inputs
code = code.replace(
  /value=\{formData\.salary === 0 \? '' : formData\.salary\}/g,
  'value={formData.salary}'
);

code = code.replace(
  /value=\{formData\.overheads === 0 \? '' : formData\.overheads\}/g,
  'value={formData.overheads}'
);

code = code.replace(
  /value=\{formData\.costPerHour === 0 \? '' : formData\.costPerHour\}/g,
  'value={formData.costPerHour}'
);

// If the user deletes the number, it parses to NaN, so let's handle that in onChange
// Actually handleFinancialChange already does parseFloat(e.target.value) || 0, which turns empty string to 0.

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/components/dnd/DroppablePhaseLane.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'className="flex flex-col gap-3 flex-1 overflow-y-auto overflow-x-hidden min-h-[300px]"',
  'className="flex flex-col gap-3 flex-1 overflow-visible min-h-[300px]"'
);

fs.writeFileSync(file, code);

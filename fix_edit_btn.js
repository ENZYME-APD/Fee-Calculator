const fs = require('fs');
const file = 'src/components/planning/GanttGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}",
  "onPointerDown={(e) => e.stopPropagation()}\n                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}"
);

fs.writeFileSync(file, code);

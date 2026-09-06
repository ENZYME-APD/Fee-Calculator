const fs = require('fs');

const files = [
  'src/components/dnd/DraggablePhaseAllocationChip.tsx',
  'src/components/dnd/DraggablePhaseCostChip.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(
    'relative cursor-grab active:cursor-grabbing",',
    'relative hover:z-50 cursor-grab active:cursor-grabbing",'
  );
  fs.writeFileSync(file, code);
});

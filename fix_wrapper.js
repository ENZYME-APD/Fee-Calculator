const fs = require('fs');

const docFile = 'src/components/documents/DocumentBuilder.tsx';
let docCode = fs.readFileSync(docFile, 'utf8');

docCode = docCode.replace(
  'return (\n    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950">',
  'return (\n    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>\n    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950">'
);

fs.writeFileSync(docFile, docCode);

const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the absolute positioned add bar with one that extends its hit area
// Or simply always show it with a very subtle opacity instead of completely disappearing,
// and on hover of the button itself, it becomes fully visible.
// Actually, it's better to keep it opacity-0 group-hover:opacity-100 but add a 
// padding wrapper so it catches hover.
// Let's just change `opacity-0 group-hover:opacity-100` to `opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:opacity-100`
// Also we can add a pseudo-element or just a padding-bottom to the block to cover the gap.
// Wait, the gap is space-y-6 (1.5rem = 24px).
// Instead of space-y-6, it might be better to just add `pb-6` to the block and no space-y-6? 
// But space-y-6 is standard.

code = code.replace(
  'absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 print:hidden flex items-center',
  'absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity z-50 print:hidden flex items-center'
);

fs.writeFileSync(file, code);

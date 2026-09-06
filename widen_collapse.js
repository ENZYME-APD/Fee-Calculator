const fs = require('fs');
const file = 'src/components/planning/GanttGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add COLLAPSED_WIDTH
code = code.replace(
  "const CELL_WIDTH = 48;",
  "const CELL_WIDTH = 48;\nconst COLLAPSED_WIDTH = 64;"
);

// 2. Update dayCoords
code = code.replace(
  "currentX += CELL_WIDTH;",
  "currentX += COLLAPSED_WIDTH;" // Only the first occurrence inside if (isCollapsed)
);
// Be careful with replacement. Let's use regex to be precise.
code = code.replace(
  /if \(isCollapsed\) \{\s*for \(let i = 0; i < phaseDays; i\+\+\) \{\s*coords\[currentDay \+ i\] = \{ x: currentX, w: 0 \}; \s*\}\s*currentX \+= CELL_WIDTH;\s*\}/g,
  `if (isCollapsed) {
          for (let i = 0; i < phaseDays; i++) {
             coords[currentDay + i] = { x: currentX, w: 0 }; 
          }
          currentX += COLLAPSED_WIDTH;
       }`
);

// 3. Update width usages
code = code.replace(
  "const width = isCollapsed ? CELL_WIDTH : pt.durationDays * CELL_WIDTH;",
  "const width = isCollapsed ? COLLAPSED_WIDTH : pt.durationDays * CELL_WIDTH;"
);

code = code.replace(
  /width: CELL_WIDTH \}\}>\s*<span className="text-\[10px\] text-slate-400 font-bold tracking-widest uppercase overflow-hidden" style={{ writingMode: 'vertical-rl', transform: 'rotate\(180deg\)' }}>\{pt.name\}<\/span>/g,
  `width: COLLAPSED_WIDTH }}>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '100%' }}>{pt.name}</span>`
);

code = code.replace(
  /className="absolute h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50\/50 dark:bg-slate-900\/30" style=\{\{ left: x, width: CELL_WIDTH \}\}/g,
  `className="absolute h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" style={{ left: x, width: COLLAPSED_WIDTH }}`
);

fs.writeFileSync(file, code);

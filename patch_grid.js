const fs = require('fs');
const file = 'src/components/planning/GanttGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

// Phase timeline compute
code = code.replace(
  "const phaseColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];",
  `const phaseColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];

  const phaseTimeline = useMemo(() => {
    let currentStart = startDate;
    return [...phases].sort((a,b) => a.order - b.order).map(phase => {
      const start = new Date(currentStart);
      const durationDays = phase.durationWeeks * 7;
      const end = addDays(start, durationDays);
      currentStart = end;
      return { ...phase, startDate: start, endDate: end, durationDays };
    });
  }, [phases, startDate]);`
);

// Add Phase Header track
const headerRowReplace = `{/* Header Row (Dates) */}
          <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-20 w-max">
            {/* Phase Track */}
            <div className="flex h-8 border-b border-slate-100 dark:border-slate-800/50 relative">
              {phaseTimeline.map(pt => {
                const offsetDays = differenceInDays(pt.startDate, startDate);
                const widthDays = pt.durationDays;
                if (offsetDays >= days) return null;
                const left = offsetDays * CELL_WIDTH;
                const width = widthDays * CELL_WIDTH;
                const colorClass = getPhaseColor(pt.id!);
                return (
                  <div 
                    key={pt.id} 
                    className={\`absolute top-1 h-6 rounded-md px-2 flex items-center shadow-sm text-white text-xs font-bold \${colorClass}\`}
                    style={{ left: left + 2, width: width - 4, opacity: 0.8 }}
                  >
                     {pt.name}
                  </div>
                )
             })}
            </div>
            
            {/* Dates Row */}
            <div className="flex h-12">
            {dates.map((date, i) => (
              <div 
                key={i} 
                className={\`w-[48px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] \${isWeekend(date) ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400' : 'text-slate-700 dark:text-slate-300'}\`}
              >
                <span className="font-medium opacity-50 uppercase tracking-wider">{format(date, 'EE')}</span>
                <span className="font-bold text-xs">{format(date, 'd')}</span>
              </div>
            ))}
            </div>
          </div>`;

code = code.replace(
  /{ \/\* Header Row \(Dates\) \*\/ \}[\s\S]*?(?={<div className="w-max relative">)/m,
  headerRowReplace + '\n\n          '
);

// Dragging logic
const dragState = `
  const [draggingTask, setDraggingTask] = useState<{ id: string; startLeft: number; startWidth: number; initialMouseX: number; type: 'move' | 'resize' } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handlePointerDown = (e: React.PointerEvent, task: ProjectTask, type: 'move' | 'resize', currentLeft: number, currentWidth: number) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDraggingTask({
      id: task.id!,
      startLeft: currentLeft,
      startWidth: currentWidth,
      initialMouseX: e.clientX,
      type
    });
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTask) return;
    const deltaX = e.clientX - draggingTask.initialMouseX;
    setDragOffset(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingTask) return;
    e.target.releasePointerCapture(e.pointerId);
    
    // Calculate new start or width based on snap (CELL_WIDTH)
    const snapDelta = Math.round(dragOffset / CELL_WIDTH);
    
    if (snapDelta !== 0) {
      if (draggingTask.type === 'move') {
        const task = tasks.find(t => t.id === draggingTask.id);
        if (task) {
          const newStart = addDays(new Date(task.startDate), snapDelta).getTime();
          onTaskUpdate(task.id!, { startDate: newStart });
        }
      } else if (draggingTask.type === 'resize') {
        const task = tasks.find(t => t.id === draggingTask.id);
        if (task) {
          const newDuration = Math.max(8, task.durationHours + (snapDelta * 8));
          onTaskUpdate(task.id!, { durationHours: newDuration });
        }
      }
    }
    
    setDraggingTask(null);
    setDragOffset(0);
  };
`;

code = code.replace(
  "const getPhaseColor = (phaseId: string) => {",
  dragState + "\n  const getPhaseColor = (phaseId: string) => {"
);

// Add event handlers to the scrolling container
code = code.replace(
  'className="flex-1 overflow-auto relative hidden-scrollbar" style={{ cursor: \'grab\' }}',
  'className="flex-1 overflow-auto relative hidden-scrollbar" style={{ cursor: draggingTask ? (draggingTask.type === \'move\' ? \'grabbing\' : \'col-resize\') : \'default\' }} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}'
);

// Task Rendering replacement
const taskRenderOld = `return (
                    <div 
                      key={task.id}
                      className={\`absolute top-2 h-12 rounded-md shadow-sm flex items-center px-2 cursor-pointer hover:ring-2 ring-blue-400 z-10 transition-all \${colorClass} text-white\`}
                      style={{ 
                        left: \`\${left + 4}px\`, 
                        width: \`\${width - 8}px\`,
                        opacity: 0.9
                      }}
                      title={task.name}
                    >
                      <span className="text-xs font-semibold truncate">{task.name}</span>
                    </div>
                  );`;

const taskRenderNew = `
                  const isDraggingThis = draggingTask?.id === task.id;
                  let displayLeft = left;
                  let displayWidth = width;
                  
                  if (isDraggingThis) {
                    if (draggingTask.type === 'move') displayLeft += dragOffset;
                    if (draggingTask.type === 'resize') displayWidth = Math.max(CELL_WIDTH, displayWidth + dragOffset);
                  }

                  return (
                    <div 
                      key={task.id}
                      className={\`absolute top-2 h-12 rounded-md shadow-sm flex items-center px-2 z-10 \${colorClass} text-white group/task select-none\`}
                      style={{ 
                        left: \`\${displayLeft + 4}px\`, 
                        width: \`\${displayWidth - 8}px\`,
                        opacity: isDraggingThis ? 0.7 : 0.9,
                        transition: isDraggingThis ? 'none' : 'left 0.2s, width 0.2s',
                        cursor: 'grab'
                      }}
                      onPointerDown={(e) => handlePointerDown(e, task, 'move', displayLeft, displayWidth)}
                      title={task.name}
                    >
                      <span className="text-xs font-semibold truncate pointer-events-none">{task.name}</span>
                      
                      {/* Resize Handle */}
                      <div 
                        className="absolute right-0 top-0 w-4 h-full cursor-col-resize opacity-0 group-hover/task:opacity-100 flex items-center justify-center"
                        onPointerDown={(e) => handlePointerDown(e, task, 'resize', displayLeft, displayWidth)}
                      >
                        <div className="w-1 h-4 bg-white/50 rounded-full pointer-events-none" />
                      </div>
                    </div>
                  );`;

code = code.replace(taskRenderOld, taskRenderNew);

// Adjust left column Team Member heights to match the new header
code = code.replace(
  '<div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0">',
  '<div className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0 bg-slate-100 dark:bg-slate-900">'
);

fs.writeFileSync(file, code);

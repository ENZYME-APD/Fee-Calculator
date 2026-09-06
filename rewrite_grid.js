const fs = require('fs');
const file = 'src/components/planning/GanttGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the return statement
const oldReturn = code.substring(code.indexOf('return ('), code.indexOf(';\n}') + 1);

const newReturn = `return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      <div 
        className="flex-1 overflow-auto relative hidden-scrollbar" 
        style={{ cursor: draggingTask ? (draggingTask.type === 'move' ? 'grabbing' : 'col-resize') : 'default' }} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp}
      >
        <div className="w-max min-w-full flex flex-col">
          
          {/* Header Row */}
          <div className="sticky top-0 z-30 flex shadow-sm">
            {/* Top-Left Corner (Sticky) */}
            <div className="w-64 shrink-0 sticky left-0 z-40 bg-slate-100 dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 h-20 flex items-center px-4 box-border">
              <span className="font-bold text-sm text-slate-500 uppercase">Team Members</span>
            </div>
            
            {/* Timeline Headers */}
            <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-20 box-border">
              {/* Phase Track (h-8) */}
              <div className="flex h-8 border-b border-slate-100 dark:border-slate-800/50 relative box-border">
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
              
              {/* Dates Row (h-12) */}
              <div className="flex h-12 box-border">
                {dates.map((date, i) => (
                  <div 
                    key={i} 
                    className={\`w-[48px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] box-border \${isWeekend(date) ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400' : 'text-slate-700 dark:text-slate-300'}\`}
                  >
                    <span className="font-medium opacity-50 uppercase tracking-wider">{format(date, 'EE')}</span>
                    <span className="font-bold text-xs">{format(date, 'd')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Body */}
          {projectMembers.map(member => (
            <div key={member.id} className="flex h-16 border-b border-slate-100 dark:border-slate-800/50 group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors box-border relative">
              
              {/* Left Column Member (Sticky) */}
              <div className="w-64 shrink-0 sticky left-0 z-20 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 group-hover/row:bg-slate-50/50 dark:group-hover/row:bg-slate-900/20 transition-colors box-border shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm truncate">{member.name}</span>
                  <span className="text-xs text-slate-500 truncate">{member.role || member.position}</span>
                </div>
              </div>

              {/* Grid Cells Container */}
              <div className="flex relative box-border">
                {/* Background Cells */}
                {dates.map((date, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleCellClick(member.id!, date)}
                    className={\`w-[48px] shrink-0 border-r border-slate-100 dark:border-slate-800/50 cursor-pointer flex items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all box-border \${isWeekend(date) ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''}\`}
                  >
                    <Plus size={14} className="text-blue-400" />
                  </div>
                ))}

                {/* Render Tasks for this member */}
                {tasks.filter(t => t.memberId === member.id).map(task => {
                  const taskStart = new Date(task.startDate);
                  taskStart.setHours(0,0,0,0);
                  
                  const offsetDays = differenceInDays(taskStart, startDate);
                  if (offsetDays < 0 || offsetDays >= days) return null;
                  
                  const durationDays = Math.max(1, task.durationHours / 8);
                  const left = offsetDays * CELL_WIDTH;
                  const width = durationDays * CELL_WIDTH;
                  const colorClass = getPhaseColor(task.phaseId);

                  const isDraggingThis = draggingTask?.id === task.id;
                  let displayLeft = left;
                  let displayWidth = width;
                  
                  if (isDraggingThis) {
                    if (draggingTask?.type === 'move') displayLeft += dragOffset;
                    if (draggingTask?.type === 'resize') displayWidth = Math.max(CELL_WIDTH, displayWidth + dragOffset);
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync(file, code);

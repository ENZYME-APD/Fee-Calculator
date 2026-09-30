const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update outermost container
code = code.replace(
  '<div className="h-full w-full overflow-y-auto p-8 pb-24 text-slate-900 dark:text-white">',
  '<div className="flex flex-col h-full w-full p-8 text-slate-900 dark:text-white">'
);

code = code.replace(
  '<div className="max-w-7xl mx-auto">',
  '<div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">'
);

// 2. Make Main Header shrink-0
code = code.replace(
  '<div className="flex items-center justify-between mb-8">',
  '<div className="flex items-center justify-between mb-8 shrink-0">'
);

// 3. Make Grid flex-1 min-h-0
code = code.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">',
  '<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">'
);

// 4. Update Left Column
const oldLeftCol = `<div className="lg:col-span-1">
            <div className="space-y-4 lg:mt-[52px]">`;
const newLeftCol = `<div className="lg:col-span-1 h-full overflow-y-auto pr-2 pb-8 custom-scrollbar">
            <div className="space-y-4 lg:mt-[52px]">`;
code = code.replace(oldLeftCol, newLeftCol);

// 5. Update Right Column
const oldRightCol = `<div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center bg-transparent">`;
const newRightCol = `<div className="lg:col-span-3 flex flex-col h-full min-h-0">
            <div className="flex justify-between items-center bg-transparent shrink-0 mb-6">`;
code = code.replace(oldRightCol, newRightCol);

// 6. Wrap right column content in overflow-y-auto
const rightContentStart = `{/* Non Billable Roster */}`;
const newRightContentStart = `<div className="flex-1 overflow-y-auto pr-4 pb-24 space-y-6 custom-scrollbar">\n            {/* Non Billable Roster */}`;
code = code.replace(rightContentStart, newRightContentStart);

// Close the scroll container at the end of the right column
const rightContentEnd = `</div>

          </div>
        </div>
      </div>

      <ConfirmModal`;
const newRightContentEnd = `</div>
            </div>

          </div>
        </div>
      </div>

      <ConfirmModal`;
code = code.replace(rightContentEnd, newRightContentEnd);


fs.writeFileSync(file, code);

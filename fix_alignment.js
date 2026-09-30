const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLeftCol = `<div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">`;

const newLeftCol = `<div className="lg:col-span-1">
            <div className="space-y-4 lg:mt-[52px]">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">`;

code = code.replace(oldLeftCol, newLeftCol);

// Fix the closing div for left column by checking where it ends
// Oh wait, there are exactly 2 blocks in the left column right now: Summary card and Chart card.
// Let's replace the last `</div>` of the left column with `</div></div>`
// Let's look for `<div className="lg:col-span-3 space-y-6">`
const oldRightColStart = `<div className="lg:col-span-3 space-y-6">`;
const newRightColStart = `</div>\n          <div className="lg:col-span-3 space-y-6">`;

code = code.replace(oldRightColStart, newRightColStart);


fs.writeFileSync(file, code);

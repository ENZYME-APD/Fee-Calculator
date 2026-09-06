const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove the border and bg from rich text
code = code.replace(
  'className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50"',
  'className="prose-wrapper"'
);

// Implement Team Breakdown Table
const teamBreakdownCode = `
    if (block.type === 'team_breakdown') {
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Team Member</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold text-center">Allocated Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {members.map(member => {
                const memberAllocations = allocations.filter(a => a.memberId === member.id);
                if (memberAllocations.length === 0) return null;
                
                const totalHours = memberAllocations.reduce((sum, a) => sum + a.hours, 0);
                
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{member.position}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-800 dark:text-slate-200">{totalHours} hrs</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
`;

code = code.replace(
  /if \(block\.type === 'team_breakdown'\) \{[\s\S]*?return null;/m,
  teamBreakdownCode + '\n    return null;'
);

// Make the input less prominent when not focused
code = code.replace(
  'className="text-xl font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none mb-4 w-full focus:ring-2 focus:ring-blue-500/20 rounded"',
  'className="text-2xl font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none mb-2 w-full focus:ring-2 focus:ring-blue-500/20 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors py-1 -ml-1 px-1"'
);

// Make the block wrapper look cleaner
code = code.replace(
  'className="group relative bg-white dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl transition-colors p-4 -mx-4"',
  'className="group relative bg-white dark:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:shadow-sm rounded-xl transition-all p-6 -mx-6"'
);


fs.writeFileSync(file, code);

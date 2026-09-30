const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update handleMemberChange
const oldHandleMemberChange = `  const handleMemberChange = async (memberId: string, nonBillablePercentage: number) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, nonBillablePercentage } : m));
    await updateTeamMember(memberId, { nonBillablePercentage });
  };`;
const newHandleMemberChange = `  const handleMemberChange = async (memberId: string, nonBillablePercentage: number, nonBillableDescription?: string) => {
    const update: any = { nonBillablePercentage };
    if (nonBillableDescription !== undefined) update.nonBillableDescription = nonBillableDescription;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...update } : m));
    await updateTeamMember(memberId, update);
  };`;
code = code.replace(oldHandleMemberChange, newHandleMemberChange);

// 2. Update table headers
const oldHeaders = `<th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">Yearly Salary</th>
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">% Non-Billable</th>`;
const newHeaders = `<th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">Yearly Salary</th>
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">Task Description</th>
                        <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">% Non-Billable</th>`;
code = code.replace(oldHeaders, newHeaders);

// 3. Update colSpan
code = code.replace(/colSpan=\{4\}/g, 'colSpan={5}');

// 4. Update table row
const oldRow = `<td className="px-4 py-2 text-sm text-slate-500">\${yearly.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="0" max="100" 
                                        value={pct}
                                        onChange={e => handleMemberChange(m.id!, Number(e.target.value))}
                                        className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-500 px-2 py-1 text-sm rounded outline-none"
                                      />
                                      <span className="text-sm font-bold text-slate-500">%</span>
                                    </div>
                                  </td>`;
const newRow = `<td className="px-4 py-2 text-sm text-slate-500">\${yearly.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-sm">
                                    <input 
                                      type="text"
                                      value={m.nonBillableDescription || ''}
                                      onChange={e => handleMemberChange(m.id!, m.nonBillablePercentage || 0, e.target.value)}
                                      placeholder="e.g. Admin, BD..."
                                      className="w-full bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 px-1 py-1 text-sm outline-none transition-colors"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="0" max="100" 
                                        value={pct}
                                        onChange={e => handleMemberChange(m.id!, Number(e.target.value), m.nonBillableDescription)}
                                        className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-500 px-2 py-1 text-sm rounded outline-none"
                                      />
                                      <span className="text-sm font-bold text-slate-500">%</span>
                                    </div>
                                  </td>`;
code = code.replace(oldRow, newRow);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add teamCategories if missing
if (!code.includes('const [teamCategories, setTeamCategories]')) {
  code = code.replace(
    'const [categories, setCategories] = useState<OverheadCategory[]>(DEFAULT_CATEGORIES);',
    'const [categories, setCategories] = useState<OverheadCategory[]>(DEFAULT_CATEGORIES);\n  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([]);'
  );
  
  code = code.replace(
    'getTeamMembers(),\n          getOverheadsProfile()',
    'getTeamMembers(),\n          getOverheadsProfile(),\n          getCategories()'
  );
  
  code = code.replace(
    'const [mems, prof] = await Promise.all',
    'const [mems, prof, tCats] = await Promise.all'
  );
  
  code = code.replace(
    'if (prof) {',
    'if (tCats) setTeamCategories(tCats);\n        if (prof) {'
  );
}

// Replace the members.map with the grouped logic
const startIdx = code.indexOf('<tbody>');
const endIdx = code.indexOf('</tbody>') + '</tbody>'.length;

const newTbody = `<tbody>
                      {Object.entries(
                        members.reduce((groups, m) => {
                          const cat = m.category || 'UNCATEGORIZED';
                          if (!groups[cat]) groups[cat] = [];
                          groups[cat].push(m);
                          return groups;
                        }, {} as Record<string, TeamMember[]>)
                      )
                      .sort(([catA], [catB]) => {
                        const orderA = teamCategories.find(c => c.id === catA)?.order ?? 99;
                        const orderB = teamCategories.find(c => c.id === catB)?.order ?? 99;
                        return orderA - orderB;
                      })
                      .map(([categoryId, catMembers]) => {
                        const categoryName = teamCategories.find(c => c.id === categoryId)?.name || 'Uncategorized';
                        return (
                          <React.Fragment key={categoryId}>
                            <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                              <td colSpan={4} className="px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {categoryName}
                              </td>
                            </tr>
                            {catMembers.map(m => {
                              const yearly = m.salary * 12;
                              const pct = m.nonBillablePercentage || 0;
                              const burden = yearly * (pct / 100);
                              return (
                                <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                  <td className="px-4 py-2 text-sm font-medium pl-8">{m.name}</td>
                                  <td className="px-4 py-2 text-sm text-slate-500">\\\${yearly.toLocaleString()}</td>
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
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right font-bold text-rose-500/80">\\\${burden.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>`;

code = code.slice(0, startIdx) + newTbody + code.slice(endIdx);
fs.writeFileSync(file, code);

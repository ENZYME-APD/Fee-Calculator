const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure getCategories is imported
if (!code.includes('getCategories')) {
  code = code.replace(
    'getTeamMembers, getOverheadsProfile, updateOverheadsProfile, updateTeamMember',
    'getTeamMembers, getOverheadsProfile, updateOverheadsProfile, updateTeamMember, getCategories'
  );
  code = code.replace(
    'OverheadItem } from',
    'OverheadItem, TeamCategory } from'
  );
}

// Add state for teamCategories
if (!code.includes('teamCategories, setTeamCategories')) {
  code = code.replace(
    'const [categories, setCategories] = useState<OverheadCategory[]>(DEFAULT_CATEGORIES);',
    `const [categories, setCategories] = useState<OverheadCategory[]>(DEFAULT_CATEGORIES);\n  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([]);`
  );
}

// Load team categories
if (!code.includes('getCategories()')) {
  code = code.replace(
    'getTeamMembers(),',
    'getTeamMembers(),\n          getCategories(),'
  );
  code = code.replace(
    'const [mems, prof] = await Promise.all([',
    'const [mems, tCats, prof] = await Promise.all(['
  );
  code = code.replace(
    'setMembers(mems);',
    'setMembers(mems);\n        setTeamCategories(tCats);'
  );
}

// Replace the tbody for non-billable
const tbodyOld = `                    <tbody>
                      {members.map(m => {
                        const yearly = m.salary * 12;
                        const pct = m.nonBillablePercentage || 0;
                        const burden = yearly * (pct / 100);
                        return (
                          <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="p-4 font-medium">{m.name}</td>
                            <td className="p-4 text-slate-500">\\\${yearly.toLocaleString()}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="range" 
                                  min="0" max="100" 
                                  value={pct}
                                  onChange={e => handleMemberChange(m.id!, Number(e.target.value))}
                                  className="w-24"
                                />
                                <span className="text-sm font-bold w-10">{pct}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-right font-bold text-rose-500/80">\\\${burden.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>`;

const tbodyNew = `                    <tbody>
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
                              <td colSpan={4} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {categoryName}
                              </td>
                            </tr>
                            {catMembers.map(m => {
                              const yearly = m.salary * 12;
                              const pct = m.nonBillablePercentage || 0;
                              const burden = yearly * (pct / 100);
                              return (
                                <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                  <td className="p-4 font-medium pl-8">{m.name}</td>
                                  <td className="p-4 text-slate-500">\\\${yearly.toLocaleString()}</td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="range" 
                                        min="0" max="100" 
                                        value={pct}
                                        onChange={e => handleMemberChange(m.id!, Number(e.target.value))}
                                        className="w-24"
                                      />
                                      <span className="text-sm font-bold w-10">{pct}%</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-bold text-rose-500/80">\\\${burden.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>`;

code = code.replace(tbodyOld, tbodyNew);

fs.writeFileSync(file, code);

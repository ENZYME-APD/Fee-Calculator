const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace yearlyIncomeTarget input
const oldIncomeInput = `<input 
                    type="number" 
                    value={yearlyIncomeTarget}
                    onChange={e => setYearlyIncomeTarget(Number(e.target.value))}
                    className="w-24 bg-transparent text-right outline-none font-bold text-sm"
                  />`;
const newIncomeInput = `<input 
                    type="text" 
                    value={yearlyIncomeTarget ? yearlyIncomeTarget.toLocaleString() : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setYearlyIncomeTarget(val ? parseInt(val) : 0);
                    }}
                    className="w-24 bg-transparent text-right outline-none font-bold text-sm"
                  />`;
code = code.replace(oldIncomeInput, newIncomeInput);

// Replace workingHoursPerYear input
const oldHoursInput = `<input 
                    type="number" 
                    value={workingHoursPerYear}
                    onChange={e => setWorkingHoursPerYear(Number(e.target.value))}
                    className="w-20 bg-transparent text-right outline-none font-bold text-sm"
                  />`;
const newHoursInput = `<input 
                    type="text" 
                    value={workingHoursPerYear ? workingHoursPerYear.toLocaleString() : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setWorkingHoursPerYear(val ? parseInt(val) : 0);
                    }}
                    className="w-24 bg-transparent text-right outline-none font-bold text-sm"
                  />`;
code = code.replace(oldHoursInput, newHoursInput);

fs.writeFileSync(file, code);

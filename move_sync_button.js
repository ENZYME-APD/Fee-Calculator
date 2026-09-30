const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove the Sync to Team button from the left column
const syncButtonHtml = `              <button 
                onClick={handleSyncToTeam}
                disabled={syncing}
                className="flex items-center justify-center gap-2 px-4 py-2 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                {syncing ? 'Syncing...' : 'Sync to Team'}
              </button>`;
code = code.replace(syncButtonHtml, '');

// 2. Add it to the header
const saveButtonHtml = `<button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>`;

const newHeaderButtons = `<button 
              onClick={handleSyncToTeam}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? 'Syncing...' : 'Sync to Team'}
            </button>\n            ` + saveButtonHtml;

code = code.replace(saveButtonHtml, newHeaderButtons);

// 3. To compress the sidebar to one screen height, maybe we can combine Summary and Global Metrics into one card.
const globalMetricsHtml = `<div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Global Metrics</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Target Yearly Income</label>
                  <input 
                    type="number" 
                    value={yearlyIncomeTarget}
                    onChange={e => setYearlyIncomeTarget(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Working Hours / Year</label>
                  <input 
                    type="number" 
                    value={workingHoursPerYear}
                    onChange={e => setWorkingHoursPerYear(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>`;

code = code.replace(globalMetricsHtml, '');

const summaryHtml = `<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Summary</h3>
              
              <div className="mb-3">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Yearly Overheads</div>
                <div className="text-2xl font-bold text-rose-500">\\\${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Monthly Burn Rate</div>
                <div className="text-lg font-bold">\\\${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overhead Multiplier</div>
                <div className="text-xl font-bold text-blue-500">{computedStats.multiplier.toFixed(2)}x</div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">% of Income</div>
                <div className="text-lg font-bold">{(computedStats.overheadPercentVsIncome * 100).toFixed(1)}%</div>
              </div>`;

const combinedSummaryHtml = `<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Global Metrics</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-500">Target Income</label>
                  <input 
                    type="number" 
                    value={yearlyIncomeTarget}
                    onChange={e => setYearlyIncomeTarget(Number(e.target.value))}
                    className="w-24 bg-transparent text-right outline-none font-bold"
                  />
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-500">Work Hrs/Yr</label>
                  <input 
                    type="number" 
                    value={workingHoursPerYear}
                    onChange={e => setWorkingHoursPerYear(Number(e.target.value))}
                    className="w-20 bg-transparent text-right outline-none font-bold"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total/Yr</div>
                  <div className="text-xl font-bold text-rose-500">\\\${computedStats.totalOverheadsYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Burn</div>
                  <div className="text-xl font-bold">\\\${(computedStats.totalOverheadsYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Multiplier</div>
                  <div className="text-xl font-bold text-blue-500">{computedStats.multiplier.toFixed(2)}x</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">% of Income</div>
                  <div className="text-xl font-bold">{(computedStats.overheadPercentVsIncome * 100).toFixed(1)}%</div>
                </div>
              </div>`;

code = code.replace(summaryHtml, combinedSummaryHtml);

fs.writeFileSync(file, code);

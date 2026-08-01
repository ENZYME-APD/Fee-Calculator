import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/dashboard/OverviewDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  `import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectCosts, getUsersByCompany } from '@/lib/firebase/db';`,
  `import { getProjects, getPhases, getTeamMembers, getAllocations, getProjectCosts, getUsersByCompany, getAllPayments } from '@/lib/firebase/db';`
);

// 2. State Additions
content = content.replace(
  `  const [scatterData, setScatterData] = useState<any[]>([]);`,
  `  const [scatterData, setScatterData] = useState<any[]>([]);
  
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [projectColors, setProjectColors] = useState<Record<string, string>>({});
  
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });`
);

// 3. Update loadData dependencies
content = content.replace(
  `    const companyUsers = await getUsersByCompany();`,
  `    const companyUsers = await getUsersByCompany();
    const payments = await getAllPayments();`
);

// 4. Update data calculation
content = content.replace(
  `    setKpis({ pipelineValue: pipeline, activeValue: active, avgMargin });
    setScatterData(projectStats.filter(p => p.totalFee > 0));
    setLoading(false);`,
  `    setKpis({ pipelineValue: pipeline, activeValue: active, avgMargin });
    setScatterData(projectStats.filter(p => p.totalFee > 0));

    // Calculate Timeline
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#14b8a6', '#f43f5e'];
    const pColors: Record<string, string> = {};
    const pNames: string[] = [];
    
    projs.forEach((p, idx) => {
      pColors[p.name] = colors[idx % colors.length];
      pNames.push(p.name);
    });
    setProjectColors(pColors);
    setProjectNames(pNames);

    const tMap: Record<string, any> = {};
    
    payments.forEach(payment => {
      const proj = projs.find(p => p.id === payment.projectId);
      if (!proj) return;
      const stats = projectStats.find(p => p.id === proj.id);
      if (!stats) return;
      
      const paymentValue = (payment.percentage / 100) * stats.totalFee;
      
      const projStart = new Date(proj.startDate || Date.now());
      let paymentDate = new Date(projStart);
      const projPhases = phases.filter(p => p.projectId === proj.id).sort((a,b) => a.order - b.order);
      
      if (payment.phaseId) {
        let weeksToAdd = 0;
        for (const phase of projPhases) {
          weeksToAdd += phase.durationWeeks || 1;
          if (phase.id === payment.phaseId) break;
        }
        paymentDate.setDate(paymentDate.getDate() + (weeksToAdd * 7));
      } else {
        if (payment.order > 1) {
          const totalWeeks = projPhases.reduce((sum, p) => sum + (p.durationWeeks || 1), 0);
          paymentDate.setDate(paymentDate.getDate() + (totalWeeks * 7));
        }
      }
      
      const year = paymentDate.getFullYear();
      const monthStr = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
      const weekOfMonth = Math.ceil(paymentDate.getDate() / 7);
      
      const bucketKey = \`\${year}-\${monthStr}-W\${weekOfMonth}\`;
      const shortMonth = paymentDate.toLocaleString('default', { month: 'short' });
      const bucketLabel = \`\${shortMonth} W\${weekOfMonth} '\${year.toString().slice(2)}\`;
      
      if (!tMap[bucketKey]) {
        tMap[bucketKey] = { bucketKey, label: bucketLabel, dateValue: paymentDate.getTime() };
      }
      if (!tMap[bucketKey][proj.name]) {
        tMap[bucketKey][proj.name] = 0;
      }
      tMap[bucketKey][proj.name] += paymentValue;
    });

    const tArr = Object.values(tMap).sort((a: any, b: any) => a.dateValue - b.dateValue);
    setTimelineData(tArr);

    setLoading(false);`
);

// 5. Inject timeline graph JSX
content = content.replace(
  `      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">`,
  `      {/* Projected Fee Income Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Projected Fee Income</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">From:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">To:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          {(() => {
            const startMs = new Date(startDate).getTime();
            const endMs = new Date(endDate).getTime();
            const filteredData = timelineData.filter(d => d.dateValue >= startMs && d.dateValue <= endMs);
            
            if (filteredData.length === 0) {
              return (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 italic">
                  No projected payments in this timeframe.
                </div>
              );
            }
            
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis stroke="#64748b" tickFormatter={(v) => \`$\${v / 1000}k\`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: 'var(--tw-prose-bg, #fff)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {projectNames.map(name => (
                    <Bar key={name} dataKey={name} stackId="a" fill={projectColors[name]} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added timeline to OverviewDashboard.tsx');

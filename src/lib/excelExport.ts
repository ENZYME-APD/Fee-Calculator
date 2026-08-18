import * as XLSX from 'xlsx';
import { Project, Phase, TeamMember, Allocation, ProjectCost, Payment, TeamCategory } from '@/lib/firebase/schema';

export function exportProposalToExcel(
  project: Project,
  phases: Phase[],
  allocations: Allocation[],
  members: TeamMember[],
  projectCosts: ProjectCost[],
  payments: Payment[],
  categories: TeamCategory[],
  currencyCode: string
) {
  const wb = XLSX.utils.book_new();
  
  const headerStyle = { font: { bold: true } };
  const titleStyle = { font: { bold: true, sz: 14 } };

  // 1. Team Tab
  const teamRows: any[][] = [
    [
      { v: 'Name', s: headerStyle },
      { v: 'Position', s: headerStyle },
      { v: 'Category', s: headerStyle },
      { v: 'Type', s: headerStyle },
      { v: `Cost/Hr (${currencyCode})`, s: headerStyle }
    ]
  ];
  const membersMap = new Map(members.map(m => [m.id, m]));
  const projectMembers = new Set(allocations.map(a => a.memberId));
  
  projectMembers.forEach(mId => {
    const m = membersMap.get(mId);
    if (m) {
      const cat = categories.find(c => c.id === m.category);
      teamRows.push([
        m.name,
        m.position,
        cat?.name || 'Uncategorized',
        cat?.type || 'internal',
        { v: m.costPerHour, t: 'n', z: '#,##0.00' }
      ]);
    }
  });
  
  const wsTeam = XLSX.utils.aoa_to_sheet(teamRows);
  wsTeam['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsTeam, 'Team');

  // 2. Project Phases
  const phaseRows: any[][] = [];
  let rowNum = 1;
  
  phases.forEach(phase => {
    phaseRows.push([{ v: `Phase: ${phase.name} (${phase.durationWeeks} Weeks)`, s: titleStyle }]);
    rowNum++;
    
    phaseRows.push([
      { v: 'Team Member', s: headerStyle },
      { v: 'Category', s: headerStyle },
      { v: 'Hours', s: headerStyle },
      { v: `Cost/Hr`, s: headerStyle },
      { v: 'Total Cost', s: headerStyle }
    ]);
    rowNum++;
    
    const phaseAllocs = allocations.filter(a => a.phaseId === phase.id);
    const startAllocRow = rowNum;
    
    phaseAllocs.forEach(alloc => {
      const m = membersMap.get(alloc.memberId);
      if (m) {
        const cat = categories.find(c => c.id === m.category);
        phaseRows.push([
          m.name,
          cat?.name || '',
          { v: alloc.hours, t: 'n', z: '#,##0.00' },
          { v: m.costPerHour, t: 'n', z: '#,##0.00' },
          { f: `C${rowNum}*D${rowNum}`, t: 'n', z: '#,##0.00' }
        ]);
        rowNum++;
      }
    });
    const endAllocRow = rowNum - 1;
    
    // Add Phase Costs if any
    const pCosts = projectCosts.filter(c => c.phaseId === phase.id);
    let startCostRow = 0;
    let endCostRow = 0;
    
    if (pCosts.length > 0) {
      phaseRows.push([]);
      rowNum++;
      phaseRows.push([{ v: 'Additional Project Costs', s: titleStyle }]);
      rowNum++;
      phaseRows.push([
        { v: 'Name', s: headerStyle },
        { v: 'Type', s: headerStyle },
        { v: 'Quantity', s: headerStyle },
        { v: 'Unit Cost', s: headerStyle },
        { v: 'Total Cost', s: headerStyle }
      ]);
      rowNum++;
      
      startCostRow = rowNum;
      pCosts.forEach(c => {
        phaseRows.push([
          c.name,
          c.type,
          { v: c.quantity, t: 'n', z: '#,##0.00' },
          { v: c.unitCost, t: 'n', z: '#,##0.00' },
          { f: `C${rowNum}*D${rowNum}`, t: 'n', z: '#,##0.00' }
        ]);
        rowNum++;
      });
      endCostRow = rowNum - 1;
    }
    
    const allocSum = (startAllocRow > 0 && startAllocRow <= endAllocRow) ? `SUM(E${startAllocRow}:E${endAllocRow})` : '0';
    const costSum = (startCostRow > 0 && startCostRow <= endCostRow) ? `SUM(E${startCostRow}:E${endCostRow})` : '0';
    const totalCostFormula = `${allocSum}+${costSum}`;
    
    phaseRows.push(['', '', '', { v: 'PHASE TOTALS:', s: headerStyle }, { f: totalCostFormula, t: 'n', z: '#,##0.00', s: headerStyle }]);
    const totalCostRow = rowNum;
    rowNum++;
    
    const marginDec = (project.profitMargin || 0) / 100;
    phaseRows.push(['', '', '', { v: 'PHASE FEE:', s: headerStyle }, { f: `E${totalCostRow}/(1-${marginDec})`, t: 'n', z: '#,##0.00', s: headerStyle }]);
    rowNum++;
    
    phaseRows.push([]); // Empty row
    rowNum++;
  });
  
  const wsPhases = XLSX.utils.aoa_to_sheet(phaseRows);
  wsPhases['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsPhases, 'Project Phases');

  // 3. Financial Summary
  const summaryRows: any[][] = [
    [
      { v: 'Phase', s: headerStyle },
      { v: 'Duration (Wks)', s: headerStyle },
      { v: 'Total Cost', s: headerStyle },
      { v: 'Fee Proposal', s: headerStyle },
      { v: 'Margin', s: headerStyle }
    ]
  ];
  let sumRow = 2; // Data starts at row 2
  
  phases.forEach((phase, index) => {
    const phaseAllocs = allocations.filter(a => a.phaseId === phase.id);
    const pCosts = projectCosts.filter(c => c.phaseId === phase.id);
    
    let pCost = 0;
    phaseAllocs.forEach(alloc => {
      const m = membersMap.get(alloc.memberId);
      if (m) {
        pCost += alloc.hours * m.costPerHour;
      }
    });
    pCosts.forEach(c => {
      pCost += c.quantity * c.unitCost;
    });
    
    const marginDec = (project.profitMargin || 0) / 100;
    
    summaryRows.push([
      phase.name,
      { v: phase.durationWeeks, t: 'n', z: '0' },
      { v: pCost, t: 'n', z: '#,##0.00' },
      { f: `C${sumRow}/(1-${marginDec})`, t: 'n', z: '#,##0.00' },
      { f: `(D${sumRow}-C${sumRow})/D${sumRow}`, t: 'n', z: '0.0%' }
    ]);
    sumRow++;
  });
  
  const endSumRow = sumRow - 1;
  summaryRows.push([]);
  sumRow++;
  
  summaryRows.push([
    { v: 'TOTALS', s: headerStyle }, 
    { f: `SUM(B2:B${endSumRow})`, t: 'n', z: '0', s: headerStyle }, 
    { f: `SUM(C2:C${endSumRow})`, t: 'n', z: '#,##0.00', s: headerStyle }, 
    { f: `SUM(D2:D${endSumRow})`, t: 'n', z: '#,##0.00', s: headerStyle }, 
    { f: `(D${sumRow}-C${sumRow})/D${sumRow}`, t: 'n', z: '0.0%', s: headerStyle }
  ]);
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Financial Summary');

  // 4. Payment Schedule
  const paymentRows: any[][] = [
    [
      { v: 'Phase / Milestone', s: headerStyle },
      { v: 'Percentage', s: headerStyle },
      { v: 'Amount', s: headerStyle }
    ]
  ];
  let payRow = 2;
  
  payments.sort((a, b) => a.order - b.order).forEach(p => {
    paymentRows.push([
      p.name,
      { v: p.percentage / 100, t: 'n', z: '0.0%' },
      { f: `B${payRow}*'Financial Summary'!D${sumRow}`, t: 'n', z: '#,##0.00' }
    ]);
    payRow++;
  });
  
  const endPayRow = payRow - 1;
  paymentRows.push([]);
  payRow++;
  
  paymentRows.push([
    { v: 'TOTALS', s: headerStyle },
    { f: `SUM(B2:B${endPayRow})`, t: 'n', z: '0.0%', s: headerStyle },
    { f: `SUM(C2:C${endPayRow})`, t: 'n', z: '#,##0.00', s: headerStyle }
  ]);
  
  const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
  wsPayments['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment Schedule');

  // Export
  XLSX.writeFile(wb, `Fee_Proposal_${project.name.replace(/\s+/g, '_')}.xlsx`);
}

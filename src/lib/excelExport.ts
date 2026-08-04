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

  // 1. Team Tab
  const teamRows = [
    ['Name', 'Position', 'Category', 'Type', 'Cost/Hr', 'Fee/Hr']
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
        m.costPerHour.toString(),
        m.roundedFeeHour.toString()
      ]);
    }
  });
  
  const wsTeam = XLSX.utils.aoa_to_sheet(teamRows);
  XLSX.utils.book_append_sheet(wb, wsTeam, 'Team');

  // 2. Project Phases
  const phaseRows: any[][] = [];
  phases.forEach(phase => {
    phaseRows.push([`Phase: ${phase.name} (${phase.durationWeeks} Weeks)`]);
    phaseRows.push(['Team Member', 'Category', 'Hours', 'Cost/Hr', 'Fee/Hr', 'Total Cost', 'Total Fee']);
    
    const phaseAllocs = allocations.filter(a => a.phaseId === phase.id);
    let totalCost = 0;
    let totalFee = 0;
    
    phaseAllocs.forEach(alloc => {
      const m = membersMap.get(alloc.memberId);
      if (m) {
        const cat = categories.find(c => c.id === m.category);
        const cost = alloc.hours * m.costPerHour;
        const fee = alloc.hours * m.roundedFeeHour;
        totalCost += cost;
        totalFee += fee;
        
        phaseRows.push([
          m.name,
          cat?.name || '',
          alloc.hours,
          m.costPerHour,
          m.roundedFeeHour,
          cost,
          fee
        ]);
      }
    });
    
    // Add Phase Costs if any
    const pCosts = projectCosts.filter(c => c.phaseId === phase.id);
    if (pCosts.length > 0) {
      phaseRows.push([]);
      phaseRows.push(['Additional Project Costs']);
      phaseRows.push(['Name', 'Type', 'Quantity', 'Unit Cost', '', 'Total Cost']);
      pCosts.forEach(c => {
        const cost = c.quantity * c.unitCost;
        totalCost += cost;
        totalFee += cost; // Assuming costs are passed to fee directly
        phaseRows.push([
          c.name,
          c.type,
          c.quantity,
          c.unitCost,
          '',
          cost
        ]);
      });
    }
    
    phaseRows.push(['', '', '', '', 'PHASE TOTALS:', totalCost, totalFee]);
    phaseRows.push([]); // Empty row to separate phases
  });
  
  const wsPhases = XLSX.utils.aoa_to_sheet(phaseRows);
  XLSX.utils.book_append_sheet(wb, wsPhases, 'Project Phases');

  // 3. Financial Summary
  const summaryRows = [
    ['Phase', 'Duration (Wks)', 'Total Cost', 'Fee Proposal', 'Margin (%)']
  ];
  let grandTotalCost = 0;
  let grandTotalFee = 0;
  
  phases.forEach(phase => {
    const phaseAllocs = allocations.filter(a => a.phaseId === phase.id);
    const pCosts = projectCosts.filter(c => c.phaseId === phase.id);
    
    let pCost = 0;
    let pFee = 0;
    
    phaseAllocs.forEach(alloc => {
      const m = membersMap.get(alloc.memberId);
      if (m) {
        pCost += alloc.hours * m.costPerHour;
        pFee += alloc.hours * m.roundedFeeHour;
      }
    });
    
    pCosts.forEach(c => {
      const cst = c.quantity * c.unitCost;
      pCost += cst;
      pFee += cst;
    });
    
    grandTotalCost += pCost;
    grandTotalFee += pFee;
    
    const margin = pFee > 0 ? ((pFee - pCost) / pFee) * 100 : 0;
    summaryRows.push([
      phase.name,
      phase.durationWeeks.toString(),
      pCost.toString(),
      pFee.toString(),
      margin.toFixed(1) + '%'
    ]);
  });
  
  const totalMargin = grandTotalFee > 0 ? ((grandTotalFee - grandTotalCost) / grandTotalFee) * 100 : 0;
  summaryRows.push([]);
  summaryRows.push(['TOTALS', '', grandTotalCost.toString(), grandTotalFee.toString(), totalMargin.toFixed(1) + '%']);
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Financial Summary');

  // 4. Payment Schedule
  const paymentRows = [
    ['Phase / Milestone', 'Percentage', 'Amount']
  ];
  
  payments.sort((a, b) => a.order - b.order).forEach(p => {
    const amount = (grandTotalFee * p.percentage) / 100;
    paymentRows.push([
      p.name,
      p.percentage.toString() + '%',
      amount.toString()
    ]);
  });
  
  const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment Schedule');

  // Export
  XLSX.writeFile(wb, `Fee_Proposal_${project.name.replace(/\s+/g, '_')}.xlsx`);
}

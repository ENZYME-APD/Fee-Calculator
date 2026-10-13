import { Allocation, Phase, Project, ProjectCost, TeamMember } from '@/lib/firebase/schema';
import { getAllocationRate } from './allocationCost';

export interface ProjectFinancials {
  totalCost: number;
  profitMarginPercent: number;
  profitMarginAmount: number;
  totalFee: number;
}

// Single source of truth for "what does this project cost and what's the fee"
// — previously duplicated (with a drifted, non-snapshot-aware formula) in
// ProjectManager.tsx, and separately in AppLayout.tsx. Both now call this.
export function computeProjectFinancials(
  project: Project | null | undefined,
  phases: Phase[],
  allocations: Allocation[],
  projectCosts: ProjectCost[],
  members: TeamMember[]
): ProjectFinancials {
  const phaseIds = new Set(phases.map(p => p.id));
  const validAllocations = allocations.filter(a => phaseIds.has(a.phaseId));
  const validCosts = projectCosts.filter(c => phaseIds.has(c.phaseId));

  const totalCost =
    validAllocations.reduce((sum, a) => sum + a.hours * getAllocationRate(a, members.find(m => m.id === a.memberId)), 0) +
    validCosts.reduce((sum, c) => sum + c.quantity * c.unitCost, 0);

  const profitMarginPercent = project?.profitMargin ?? 30;
  const profitMarginAmount = totalCost * (profitMarginPercent / 100);
  const totalFee = totalCost + profitMarginAmount;

  return { totalCost, profitMarginPercent, profitMarginAmount, totalFee };
}

// The cost of a single phase (labor + direct costs), at today's locked-in
// allocation rates. Used by the cost-weighted payment preset and by the
// invoicing-percentage preview.
export function computePhaseCost(
  phaseId: string,
  allocations: Allocation[],
  projectCosts: ProjectCost[],
  members: TeamMember[]
): number {
  const allocCost = allocations
    .filter(a => a.phaseId === phaseId)
    .reduce((sum, a) => sum + a.hours * getAllocationRate(a, members.find(m => m.id === a.memberId)), 0);
  const directCost = projectCosts
    .filter(c => c.phaseId === phaseId)
    .reduce((sum, c) => sum + c.quantity * c.unitCost, 0);
  return allocCost + directCost;
}

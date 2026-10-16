import { Allocation, Phase, Project, ProjectCost, TeamMember } from '@/lib/firebase/schema';
import { getAllocationRate } from './allocationCost';

export interface ProjectFinancials {
  totalCost: number;
  profitMarginPercent: number;
  profitMarginAmount: number;
  totalFee: number;
  isFixedFee: boolean;
}

/** True when the project's total fee is a fixed amount rather than cost + margin. */
export function hasFixedFee(project: Project | null | undefined): boolean {
  return !!project?.fixedFee && project.fixedFee > 0;
}

/**
 * Fee = cost x this. Normally 1 + margin; with a fixed fee it is fee / cost, so every
 * per-phase fee (summary, payment schedule, documents, exports) still adds up to the fixed total.
 */
export function feeMultiplierFor(project: Project | null | undefined, totalCost: number): number {
  if (hasFixedFee(project) && totalCost > 0) return project!.fixedFee! / totalCost;
  return 1 + (project?.profitMargin ?? 30) / 100;
}

/** The margin to show: the typed one, or the one implied by a fixed fee (1 decimal). */
export function effectiveMarginPercent(project: Project | null | undefined, totalCost: number): number {
  if (!hasFixedFee(project)) return project?.profitMargin ?? 30;
  if (totalCost <= 0) return 0;
  return Math.round(((project!.fixedFee! - totalCost) / totalCost) * 1000) / 10;
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

  const isFixedFee = hasFixedFee(project);
  const totalFee = isFixedFee ? project!.fixedFee! : totalCost * feeMultiplierFor(project, totalCost);
  const profitMarginAmount = totalFee - totalCost;
  const profitMarginPercent = effectiveMarginPercent(project, totalCost);

  return { totalCost, profitMarginPercent, profitMarginAmount, totalFee, isFixedFee };
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

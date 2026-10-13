import { Allocation, TeamMember } from '@/lib/firebase/schema';

/**
 * The hourly rate to use for an allocation's cost math. Prefers the rate
 * snapshotted when the allocation was created/reassigned, so a later salary
 * change doesn't retroactively change an already-agreed fee. Falls back to
 * the member's current costPerHour for allocations created before the
 * snapshot field existed, or if the member record is missing.
 */
export function getAllocationRate(
  alloc: Pick<Allocation, 'costPerHourSnapshot'>,
  member: Pick<TeamMember, 'costPerHour'> | undefined
): number {
  return alloc.costPerHourSnapshot ?? member?.costPerHour ?? 0;
}

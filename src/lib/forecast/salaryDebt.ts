import { ForecastOutflowItem, SalaryDebt } from '@/lib/firebase/schema';

// Partner salaries owed: opening amounts + unpaid salary per month − repayments.
// Shared by the Financial forecast page and the AI connection so both give the same numbers.

export const UNASSIGNED = '_unassigned';

/** Salary left unpaid in a month (lowers that month's burn). */
export function deferredIn(sd: SalaryDebt | undefined, month: string): number {
  return Object.values(sd?.deferrals?.[month] || {}).reduce((s, v) => s + (v || 0), 0);
}

export const isRepaymentLine = (o: ForecastOutflowItem) => o.type === 'salary_repayment';

/** Amount owed at the end of `month`, in total and per partner (UNASSIGNED: repayments not tied to a partner). */
export function owedAt(sd: SalaryDebt | undefined, outflows: ForecastOutflowItem[], month: string) {
  const per: Record<string, number> = {};
  (sd?.partners || []).forEach(p => { per[p.id] = p.opening || 0; });
  Object.entries(sd?.deferrals || {}).forEach(([m, byPartner]) => {
    if (m > month) return;
    Object.entries(byPartner).forEach(([pid, v]) => { per[pid] = (per[pid] || 0) + (v || 0); });
  });
  outflows.filter(isRepaymentLine).forEach(o => {
    Object.entries(o.monthlyPills || {}).forEach(([m, pills]) => {
      if (m > month) return;
      pills.forEach(p => {
        const pid = p.partnerId && (sd?.partners || []).some(x => x.id === p.partnerId) ? p.partnerId : UNASSIGNED;
        per[pid] = (per[pid] || 0) - (p.amount || 0);
      });
    });
  });
  const total = Object.values(per).reduce((s, v) => s + v, 0);
  return { total, perPartner: per };
}

/** Repaid in a month by salary repayment lines. */
export function repaidIn(outflows: ForecastOutflowItem[], month: string): number {
  return outflows.filter(isRepaymentLine).reduce((s, o) => s + (o.monthlyPills?.[month] || []).reduce((t, p) => t + (p.amount || 0), 0), 0);
}

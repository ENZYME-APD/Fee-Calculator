import { Payment } from '@/lib/firebase/schema';

// A milestone is either a share of the fee (percentage) or a fixed amount. With a fixed amount
// the percentage is worked out from the current fee, so it follows the fee while the amount stays put.

export function hasFixedAmount(p: Pick<Payment, 'amount'>): boolean {
  return typeof p.amount === 'number' && Number.isFinite(p.amount);
}

export function paymentAmount(p: Pick<Payment, 'amount' | 'percentage'>, totalFee: number): number {
  return hasFixedAmount(p) ? (p.amount as number) : (totalFee * (p.percentage || 0)) / 100;
}

export function paymentPercent(p: Pick<Payment, 'amount' | 'percentage'>, totalFee: number): number {
  if (!hasFixedAmount(p)) return p.percentage || 0;
  return totalFee > 0 ? ((p.amount as number) / totalFee) * 100 : 0;
}

/** Percentage rounded for display (up to 2 decimals, no trailing zeros). */
export function formatPercent(n: number): string {
  return String(Math.round(n * 100) / 100);
}

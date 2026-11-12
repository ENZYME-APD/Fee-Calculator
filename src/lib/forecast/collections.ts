import { ForecastPill, ForecastRow, ForecastStage } from '@/lib/firebase/schema';

// Invoices and the Possible / Collections entry copied from each one (linked by invoiceId,
// at most one per invoice, in the same row). Collections can be marked paid.

export const LINKABLE: ForecastStage[] = ['possible', 'collections'];
export const newPillId = () => `pill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

export interface PillAt { month: string; stage: ForecastStage; pill: ForecastPill }

/** The Possible / Collections entry linked to an invoice, if any. */
export function linkedEntry(row: ForecastRow, invoiceId: string): PillAt | null {
  for (const [month, cell] of Object.entries(row.cells || {})) {
    for (const stage of LINKABLE) {
      const pill = (cell?.[stage] || []).find(p => p.invoiceId === invoiceId);
      if (pill) return { month, stage, pill };
    }
  }
  return null;
}

/** The invoice an entry is linked to, if it still exists. */
export function invoiceOf(row: ForecastRow, invoiceId?: string): { month: string; pill: ForecastPill } | null {
  if (!invoiceId) return null;
  for (const [month, cell] of Object.entries(row.cells || {})) {
    const pill = (cell?.invoicing || []).find(p => p.id === invoiceId);
    if (pill) return { month, pill };
  }
  return null;
}

/** Paid and still-expected collections in a month. */
export function collectionsSplit(rows: ForecastRow[], month: string) {
  let received = 0, waiting = 0;
  rows.forEach(r => (r.cells[month]?.collections || []).forEach(p => { if (p.paid) received += p.amount; else waiting += p.amount; }));
  return { received, waiting };
}

/** A copy of an invoice for Possible / Collections. */
export function entryFromInvoice(inv: ForecastPill): ForecastPill {
  const { id, paid: _p, invoiceId: _i, ...rest } = inv;
  return { ...rest, id: newPillId(), invoiceId: id };
}

/**
 * Existing entries that look like copies of an invoice (same row and label, not linked yet),
 * one-to-one, preferring the same amount and then the nearest month.
 */
export function suggestLinks(rows: ForecastRow[]) {
  const out: { rowId: string; rowName: string; invoice: PillAt; entry: PillAt }[] = [];
  const norm = (s: string) => (s || '').trim().toLowerCase();
  const mi = (m: string) => { const [y, mo] = m.split('-').map(Number); return y * 12 + mo; };
  rows.forEach(row => {
    const invoices: PillAt[] = [];
    const entries: PillAt[] = [];
    const linkedIds = new Set<string>();
    Object.entries(row.cells || {}).forEach(([month, cell]) => {
      (cell?.invoicing || []).forEach(pill => invoices.push({ month, stage: 'invoicing', pill }));
      LINKABLE.forEach(stage => (cell?.[stage] || []).forEach(pill => {
        if (pill.invoiceId && invoiceOf(row, pill.invoiceId)) linkedIds.add(pill.invoiceId);
        else entries.push({ month, stage, pill });
      }));
    });
    const used = new Set<string>();
    invoices.filter(i => !linkedIds.has(i.pill.id)).forEach(inv => {
      const candidates = entries.filter(e => !used.has(e.pill.id) && norm(e.pill.label) === norm(inv.pill.label) && mi(e.month) >= mi(inv.month) - 1);
      if (!candidates.length) return;
      candidates.sort((a, b) =>
        (Math.abs(a.pill.amount - inv.pill.amount) < 1 ? 0 : 1) - (Math.abs(b.pill.amount - inv.pill.amount) < 1 ? 0 : 1)
        || Math.abs(mi(a.month) - mi(inv.month)) - Math.abs(mi(b.month) - mi(inv.month)));
      used.add(candidates[0].pill.id);
      out.push({ rowId: row.id, rowName: row.name, invoice: inv, entry: candidates[0] });
    });
  });
  return out;
}

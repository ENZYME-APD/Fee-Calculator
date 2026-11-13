import { ForecastProfile } from '@/lib/firebase/schema';

// Three-way merge of the forecast, line by line: what this browser changed since it last
// loaded/saved (base → local) is kept on top of what someone else saved (base → remote).
// If both changed the same line, this browser's version wins and it is reported.

export type MergeableProfile = Pick<ForecastProfile,
  'startMonthKey' | 'openingMonthKey' | 'visibleMonthsCount' | 'startingBankBalance' |
  'possibleConversionPercent' | 'invoicingConversionPercent' | 'rows' | 'outflows' | 'groups'>;

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function mergeList<T extends { id: string }>(base: T[] = [], local: T[] = [], remote: T[] = [], clashes: string[], name: (t: T) => string): T[] {
  const byId = (list: T[]) => new Map(list.map(x => [x.id, x]));
  const b = byId(base), l = byId(local), r = byId(remote);
  const pick = (id: string): T | undefined => {
    const bv = b.get(id), lv = l.get(id), rv = r.get(id);
    if (same(lv, bv)) return rv; // only they changed it (or nobody did)
    if (same(rv, bv)) return lv; // only this browser changed it
    if (same(lv, rv)) return lv;
    const winner = lv ?? rv;
    if (winner) clashes.push(name(winner));
    return lv ?? rv; // both changed it: keep this browser's version (a deletion here loses to an edit there)
  };
  // Their order, with lines added here appended where they were
  const order = [...remote.map(x => x.id), ...local.map(x => x.id).filter(id => !r.has(id))];
  const out: T[] = [];
  new Set(order).forEach(id => { const v = pick(id); if (v) out.push(v); });
  return out;
}

export function mergeForecast(base: MergeableProfile, local: MergeableProfile, remote: MergeableProfile) {
  const clashes: string[] = [];
  const scalar = <K extends keyof MergeableProfile>(k: K): MergeableProfile[K] =>
    same(local[k], base[k]) ? remote[k] : local[k];
  const merged: MergeableProfile = {
    startMonthKey: scalar('startMonthKey'),
    openingMonthKey: scalar('openingMonthKey'),
    visibleMonthsCount: scalar('visibleMonthsCount'),
    startingBankBalance: scalar('startingBankBalance'),
    possibleConversionPercent: scalar('possibleConversionPercent'),
    invoicingConversionPercent: scalar('invoicingConversionPercent'),
    rows: mergeList(base.rows, local.rows, remote.rows, clashes, r => r.name),
    outflows: mergeList(base.outflows, local.outflows, remote.outflows, clashes, o => o.name),
    groups: mergeList(base.groups, local.groups, remote.groups, clashes, g => g.name),
  };
  return { merged, clashes };
}

export const pickMergeable = (p: Partial<ForecastProfile>): MergeableProfile => JSON.parse(JSON.stringify({
  startMonthKey: p.startMonthKey, openingMonthKey: p.openingMonthKey, visibleMonthsCount: p.visibleMonthsCount,
  startingBankBalance: p.startingBankBalance, possibleConversionPercent: p.possibleConversionPercent,
  invoicingConversionPercent: p.invoicingConversionPercent, rows: p.rows || [], outflows: p.outflows || [], groups: p.groups || [],
}));

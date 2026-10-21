import { Company, Project } from '@/lib/firebase/schema';

// Fill-in fields for proposal documents. Text blocks and saved templates keep {{field}} in their
// text; the preview, print and Word export replace it with the project's values, so one template
// works for every proposal. Missing values show as [Label] in the warning colour.

export interface FieldDef { key: string; label: string; group: string }

export const FIELD_DEFS: FieldDef[] = [
  { key: 'client', label: 'Client', group: 'Client' },
  { key: 'attn_name', label: 'Attention: name', group: 'Client' },
  { key: 'attn_title', label: 'Attention: title', group: 'Client' },
  { key: 'client_address', label: 'Client address', group: 'Client' },
  { key: 'country', label: 'Country', group: 'Client' },
  { key: 'project', label: 'Project name', group: 'Project' },
  { key: 'project_area', label: 'Project area', group: 'Project' },
  { key: 'ref', label: 'Reference', group: 'Proposal' },
  { key: 'revision', label: 'Revision', group: 'Proposal' },
  { key: 'issue_date', label: 'Issue date', group: 'Proposal' },
  { key: 'validity_days', label: 'Validity (days)', group: 'Proposal' },
  { key: 'valid_until', label: 'Valid until', group: 'Proposal' },
  { key: 'currency', label: 'Currency', group: 'Fee' },
  { key: 'fee_total', label: 'Total fee', group: 'Fee' },
  { key: 'fee_in_words', label: 'Total fee in words', group: 'Fee' },
  { key: 'total_weeks', label: 'Total duration (weeks)', group: 'Fee' },
  { key: 'weekly_rate', label: 'Team weekly rate', group: 'Fee' },
  { key: 'company', label: 'Company legal name', group: 'Company' },
  { key: 'signatory_name', label: 'Signatory', group: 'Company' },
  { key: 'signatory_title', label: 'Signatory title', group: 'Company' },
  { key: 'signatory_email', label: 'Signatory email', group: 'Company' },
  { key: 'signatory_phone', label: 'Signatory phone', group: 'Company' },
  { key: 'bank_details', label: 'Bank details (all lines)', group: 'Bank' },
  { key: 'bank_account_name', label: 'Account name', group: 'Bank' },
  { key: 'bank_account_no', label: 'Account number', group: 'Bank' },
  { key: 'bank_name', label: 'Bank name', group: 'Bank' },
  { key: 'bank_swift', label: 'SWIFT code', group: 'Bank' },
  { key: 'today', label: 'Today\'s date', group: 'Proposal' },
];

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(FIELD_DEFS.map(f => [f.key, f.label]));
export type FieldValues = Record<string, string | null>;
export const FIELD_PATTERN = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

const CURRENCY_WORDS: Record<string, [string, string]> = {
  USD: ['US Dollar', 'US Dollars'], EUR: ['Euro', 'Euros'], GBP: ['Pound Sterling', 'Pounds Sterling'],
  SGD: ['Singapore Dollar', 'Singapore Dollars'], HKD: ['Hong Kong Dollar', 'Hong Kong Dollars'],
  INR: ['Indian Rupee', 'Indian Rupees'], AED: ['UAE Dirham', 'UAE Dirhams'], SAR: ['Saudi Riyal', 'Saudi Riyals'],
  AUD: ['Australian Dollar', 'Australian Dollars'], CAD: ['Canadian Dollar', 'Canadian Dollars'],
  CHF: ['Swiss Franc', 'Swiss Francs'], JPY: ['Japanese Yen', 'Japanese Yen'], CNY: ['Chinese Yuan', 'Chinese Yuan'],
  MYR: ['Malaysian Ringgit', 'Malaysian Ringgit'], THB: ['Thai Baht', 'Thai Baht'], VND: ['Vietnamese Dong', 'Vietnamese Dong'],
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowThousand(n: number, andBefore: boolean): string {
  const h = Math.floor(n / 100), r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) {
    const t = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? `-${ONES[r % 10]}` : ''}`;
    parts.push(h || andBefore ? `and ${t}` : t);
  }
  return parts.join(' ');
}

/** 151050 → "One Hundred and Fifty-One Thousand and Fifty" (British usage). */
export function numberToWords(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return 'Zero';
  const scales = ['', 'Thousand', 'Million', 'Billion'];
  const groups: number[] = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (!groups[i]) continue;
    const isLast = i === 0 && groups.length > 1;
    words.push(`${belowThousand(groups[i], isLast && groups[i] < 100)}${scales[i] ? ` ${scales[i]}` : ''}`);
  }
  return words.join(' ');
}

export function amountInWords(amount: number, currency: string): string {
  const [one, many] = CURRENCY_WORDS[currency] || [currency, currency];
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  const main = `${numberToWords(whole)} ${whole === 1 ? one : many}`;
  return `${main}${cents ? ` and ${numberToWords(cents)} Cents` : ''} only`;
}

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const clean = (v: string | number | undefined | null) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

/** "QU-25020" + "03" → "QU-25020-03" */
export function fullRef(ref?: string, revision?: string): string | null {
  if (!ref?.trim()) return null;
  return revision?.trim() ? `${ref.trim()}-${revision.trim()}` : ref.trim();
}

export function buildFieldValues(args: {
  company: Company | null;
  project: Project | null;
  totalFee: number;
  totalWeeks: number;
}): FieldValues {
  const { company, project, totalFee, totalWeeks } = args;
  const d = company?.proposal || {};
  const p = project?.proposal || {};
  const bank = d.bank || {};
  const currency = company?.currency || 'USD';
  const validity = p.validityDays ?? d.validityDays;
  const issue = p.issueDate;
  const bankLines = [
    bank.accountName && `Account name: ${bank.accountName}`,
    bank.accountNo && `Account no.: ${bank.accountNo}`,
    bank.bankName && `Bank name: ${bank.bankName}`,
    bank.bankCode && `Bank code: ${bank.bankCode}`,
    bank.branch && `Branch: ${bank.branch}`,
    bank.swift && `SWIFT code: ${bank.swift}`,
  ].filter(Boolean).join('\n');
  const area = project?.area ? `${project.area.toLocaleString('en-US')} ${company?.areaUnit === 'sqft' ? 'sq ft' : 'sqm'}` : null;

  return {
    client: clean(p.client),
    attn_name: clean(p.attnName),
    attn_title: clean(p.attnTitle),
    client_address: clean(p.clientAddress),
    country: clean(p.country),
    project: clean(project?.name),
    project_area: area,
    ref: fullRef(p.ref, p.revision),
    revision: clean(p.revision),
    issue_date: issue ? longDate(issue) : null,
    validity_days: clean(validity),
    valid_until: issue && validity ? longDate(issue + validity * 86400000) : null,
    currency,
    fee_total: totalFee > 0 ? `${currency} ${money(totalFee)}` : null,
    fee_in_words: totalFee > 0 ? amountInWords(totalFee, currency) : null,
    total_weeks: totalWeeks > 0 ? String(totalWeeks) : null,
    weekly_rate: totalFee > 0 && totalWeeks > 0 ? `${currency} ${money(totalFee / totalWeeks)}` : null,
    company: clean(d.legalName) || clean(company?.name),
    signatory_name: clean(p.signatoryName) || clean(d.signatoryName),
    signatory_title: clean(p.signatoryName) ? clean(p.signatoryTitle) : clean(p.signatoryTitle) || clean(d.signatoryTitle),
    signatory_email: clean(d.signatoryEmail),
    signatory_phone: clean(d.signatoryPhone),
    bank_details: bankLines || null,
    bank_account_name: clean(bank.accountName),
    bank_account_no: clean(bank.accountNo),
    bank_name: clean(bank.bankName),
    bank_swift: clean(bank.swift),
    today: longDate(Date.now()),
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Replaces {{field}} in HTML. With `mark`, filled values and gaps get spans for the preview
 * (gaps in the warning colour); without it, gaps become plain [Label] text (print/Word).
 */
export function fillHtml(html: string, values: FieldValues, mark = false): string {
  return (html || '').replace(FIELD_PATTERN, (_m, raw: string) => {
    const key = raw.toLowerCase();
    const v = values[key];
    if (v) {
      const text = esc(v).replace(/\n/g, '<br>');
      return mark ? `<span class="pf-filled">${text}</span>` : text;
    }
    const label = `[${FIELD_LABELS[key] || key}]`;
    return mark ? `<span class="pf-missing" title="Fill this in Project settings → Proposal details or Settings → Proposals">${esc(label)}</span>` : esc(label);
  });
}

export function fillText(text: string, values: FieldValues): string {
  return (text || '').replace(FIELD_PATTERN, (_m, raw: string) => values[raw.toLowerCase()] || `[${FIELD_LABELS[raw.toLowerCase()] || raw}]`);
}

/** Fields used in a text that have no value yet. */
export function missingFields(texts: string[], values: FieldValues): string[] {
  const out = new Set<string>();
  texts.forEach(t => { for (const m of (t || '').matchAll(FIELD_PATTERN)) { const k = m[1].toLowerCase(); if (!values[k]) out.add(FIELD_LABELS[k] || k); } });
  return [...out];
}

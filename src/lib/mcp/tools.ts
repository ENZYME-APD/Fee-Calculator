import { adminDb } from '@/lib/firebase/admin';
import {
  Allocation, ForecastOutflowItem, ForecastProfile, OverheadsProfile, Payment, Phase, Project,
  ProjectCost, TeamCategory, TeamMember,
} from '@/lib/firebase/schema';
import { computePhaseCost, computeProjectFinancials, feeMultiplierFor } from '@/lib/utils/projectFinancials';
import { getAllocationRate } from '@/lib/utils/allocationCost';
import { paymentAmount, paymentPercent } from '@/lib/utils/payments';
import { McpContext } from './auth';

// Read-only tools for the AI connection. Every query is scoped to the caller's company, and the
// same visibility rules as the app apply: salaries, hourly rates, overheads and the cash-flow
// forecast are for admins only.

export class ToolError extends Error {}

type Json = Record<string, unknown>;

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  adminOnly?: boolean;
  run: (args: Json, ctx: McpContext, data: CompanyData) => Promise<unknown>;
}

// ---------- data loading (one request = one snapshot of the company) ----------

export class CompanyData {
  private cache = new Map<string, Promise<unknown[]>>();
  constructor(private companyId: string) {}

  private all<T>(collection: string): Promise<T[]> {
    if (!this.cache.has(collection)) {
      this.cache.set(collection, adminDb!
        .collection(collection)
        .where('companyId', '==', this.companyId)
        .get()
        .then(s => s.docs.map(d => ({ ...d.data(), id: d.id }))));
    }
    return this.cache.get(collection) as Promise<T[]>;
  }

  projects = () => this.all<Project>('projects');
  phases = () => this.all<Phase>('phases');
  allocations = () => this.all<Allocation>('allocations');
  projectCosts = () => this.all<ProjectCost>('projectCosts');
  payments = () => this.all<Payment>('payments');
  members = () => this.all<TeamMember>('teamMembers');
  categories = () => this.all<TeamCategory>('categories');
  async overheads(): Promise<OverheadsProfile | null> {
    return ((await this.all<OverheadsProfile>('overheadsProfile'))[0]) || null;
  }
  async forecast(): Promise<ForecastProfile | null> {
    return ((await this.all<ForecastProfile>('forecastProfile'))[0]) || null;
  }
}

// ---------- helpers ----------

const round = (n: number) => Math.round(n * 100) / 100;
const isoDate = (ts?: number) => (ts ? new Date(ts).toISOString().slice(0, 10) : null);
const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 0) - (b.order ?? 0);

function str(args: Json, key: string): string | undefined {
  const v = args[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
function bool(args: Json, key: string, fallback: boolean): boolean {
  return typeof args[key] === 'boolean' ? (args[key] as boolean) : fallback;
}
function int(args: Json, key: string, fallback: number, min: number, max: number): number {
  const v = Number(args[key]);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
}

async function projectBundle(data: CompanyData, project: Project) {
  const [phases, allocations, costs, members, payments] = await Promise.all([
    data.phases(), data.allocations(), data.projectCosts(), data.members(), data.payments(),
  ]);
  const p = {
    phases: phases.filter(x => x.projectId === project.id).sort(byOrder),
    allocations: allocations.filter(x => x.projectId === project.id),
    costs: costs.filter(x => x.projectId === project.id),
    payments: payments.filter(x => x.projectId === project.id).sort(byOrder),
    members,
  };
  const fin = computeProjectFinancials(project, p.phases, p.allocations, p.costs, members);
  return { ...p, fin };
}

async function findProject(data: CompanyData, ref: string): Promise<Project> {
  const projects = await data.projects();
  const exact = projects.find(p => p.id === ref) || projects.find(p => p.name.toLowerCase() === ref.toLowerCase());
  if (exact) return exact;
  const matches = projects.filter(p => p.name.toLowerCase().includes(ref.toLowerCase()));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new ToolError(`More than one project matches "${ref}": ${matches.map(m => `${m.name} (${m.id})`).join('; ')}. Use the project id.`);
  }
  throw new ToolError(`No project matches "${ref}". Call list_projects to see the names and ids.`);
}

function monthKey(offsetFrom: string, offset: number): string {
  const [y, m] = offsetFrom.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
const monthIndex = (k: string) => { const [y, m] = k.split('-').map(Number); return y * 12 + m - 1; };
const currentMonth = () => { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };

// Mirrors the forecast page: a linked line (the fixed operational burn by default) uses the live
// Team resources + Overheads figure; other lines use the month's expenses, else the every-month amount.
function isLinkedLine(item: ForecastOutflowItem) { return item.linkedToOverheads ?? item.id === 'burn_base'; }
function outflowAmount(item: ForecastOutflowItem, m: string, linkedMonthly: number): number {
  let base: number;
  if (isLinkedLine(item)) base = linkedMonthly;
  else {
    const pills = item.monthlyPills?.[m];
    base = pills && pills.length
      ? pills.reduce((s, p) => s + (p.amount || 0), 0)
      : item.monthlyAmounts?.[m] ?? item.defaultMonthlyAmount ?? 0;
  }
  return base + (item.monthlyAdjustments?.[m] ?? 0);
}

async function runningCosts(data: CompanyData) {
  const [members, categories, overheads] = await Promise.all([data.members(), data.categories(), data.overheads()]);
  const external = new Set(categories.filter(c => c.type === 'external').map(c => c.id));
  const salaries = Math.round(members.filter(m => !m.category || !external.has(m.category)).reduce((s, m) => s + (m.salary || 0), 0));
  const overheadItems = Math.round((overheads?.categories || []).flatMap(c => c.items || []).filter(i => i.isActive !== false).reduce((s, i) => s + (i.yearlyCost || 0), 0) / 12);
  return { salaries, overheads: overheadItems, total: salaries + overheadItems };
}

// ---------- tools ----------

export const TOOLS: ToolDef[] = [
  {
    name: 'get_company_overview',
    title: 'Company overview',
    description: 'Start here. Returns the company name, currency, your role, what you can see, and the pipeline: number of projects and total fee by status (Draft, Proposed, Active, Completed, Lost).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async (_args, ctx, data) => {
      const projects = (await data.projects()).filter(p => !p.isTemplate);
      const byStatus: Record<string, { projects: number; total_fee: number }> = {};
      for (const p of projects) {
        const { fin } = await projectBundle(data, p);
        const s = p.status || 'Draft';
        byStatus[s] = byStatus[s] || { projects: 0, total_fee: 0 };
        byStatus[s].projects += 1;
        byStatus[s].total_fee = round(byStatus[s].total_fee + fin.totalFee);
      }
      return {
        company: ctx.company.name,
        currency: ctx.company.currency || 'USD',
        area_unit: ctx.company.areaUnit || 'sqm',
        your_role: ctx.isAdmin ? 'admin' : ctx.role,
        pipeline_by_status: byStatus,
        templates: (await data.projects()).filter(p => p.isTemplate).length,
        visibility: ctx.isAdmin
          ? 'Admin: you can see salaries, hourly rates, overheads and the cash-flow forecast.'
          : 'Salaries, hourly rates, overheads and the cash-flow forecast are only visible to admins.',
      };
    },
  },
  {
    name: 'list_projects',
    title: 'List projects',
    description: 'Lists projects (fee proposals) with status, start date, total cost, total fee, margin and hours. Optionally filter by status, or list templates instead.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Only projects with this status: Draft, Proposed, Active, Completed or Lost.' },
        templates: { type: 'boolean', description: 'List project templates instead of projects. Default false.' },
      },
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const status = str(args, 'status')?.toLowerCase();
      const templates = bool(args, 'templates', false);
      const list = (await data.projects())
        .filter(p => !!p.isTemplate === templates)
        .filter(p => !status || (p.status || 'Draft').toLowerCase() === status);
      const rows = [];
      for (const p of list) {
        const b = await projectBundle(data, p);
        rows.push({
          id: p.id,
          name: p.name,
          status: p.status || 'Draft',
          start_date: isoDate(p.startDate),
          area: p.area ?? null,
          phases: b.phases.length,
          total_hours: round(b.allocations.filter(a => b.phases.some(ph => ph.id === a.phaseId)).reduce((s, a) => s + (a.hours || 0), 0)),
          total_cost: round(b.fin.totalCost),
          total_fee: round(b.fin.totalFee),
          margin_percent: b.fin.profitMarginPercent,
          fixed_fee: b.fin.isFixedFee,
        });
      }
      rows.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
      return {
        currency: ctx.company.currency || 'USD',
        count: rows.length,
        total_fee: round(rows.reduce((s, r) => s + r.total_fee, 0)),
        projects: rows,
      };
    },
  },
  {
    name: 'get_project',
    title: 'Project details',
    description: 'Full breakdown of one project: phases with duration, hours, cost and fee; who is allocated to each phase; direct costs; the payment schedule with amounts; and totals. Accepts the project id or its name (or part of it).',
    inputSchema: {
      type: 'object',
      properties: { project: { type: 'string', description: 'Project id or name.' } },
      required: ['project'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const ref = str(args, 'project');
      if (!ref) throw new ToolError('Give a project id or name.');
      const project = await findProject(data, ref);
      const b = await projectBundle(data, project);
      const mult = feeMultiplierFor(project, b.fin.totalCost);
      const memberById = new Map(b.members.map(m => [m.id, m]));

      const phases = b.phases.map(ph => {
        const allocs = b.allocations.filter(a => a.phaseId === ph.id);
        const cost = computePhaseCost(ph.id!, b.allocations, b.costs, b.members);
        return {
          id: ph.id,
          name: ph.name,
          duration_weeks: ph.durationWeeks,
          hours: round(allocs.reduce((s, a) => s + (a.hours || 0), 0)),
          cost: round(cost),
          fee: round(cost * mult),
          team: allocs.map(a => {
            const m = memberById.get(a.memberId);
            const row: Json = { member: m?.name || 'Removed member', position: m?.position || null, hours: round(a.hours || 0) };
            if (ctx.isAdmin) {
              const rate = getAllocationRate(a, m);
              row.cost_per_hour = round(rate);
              row.cost = round(rate * (a.hours || 0));
            }
            return row;
          }),
          direct_costs: b.costs.filter(c => c.phaseId === ph.id).map(c => ({
            name: c.name, type: c.type, quantity: c.quantity, unit_cost: round(c.unitCost), total: round(c.quantity * c.unitCost),
          })),
          ...(ph.description ? { description: ph.description } : {}),
          ...(ph.deliverables ? { deliverables: ph.deliverables } : {}),
        };
      });

      const phaseName = new Map(b.phases.map(ph => [ph.id, ph.name]));
      const schedule = b.payments.map(p => ({
        name: p.name,
        phase: p.phaseId ? phaseName.get(p.phaseId) || null : null,
        percent: round(paymentPercent(p, b.fin.totalFee)),
        amount: round(paymentAmount(p, b.fin.totalFee)),
        fixed_amount: typeof p.amount === 'number',
      }));
      const scheduled = schedule.reduce((s, p) => s + p.amount, 0);

      return {
        id: project.id,
        name: project.name,
        status: project.status || 'Draft',
        description: project.description || null,
        start_date: isoDate(project.startDate),
        area: project.area ?? null,
        currency: ctx.company.currency || 'USD',
        totals: {
          total_cost: round(b.fin.totalCost),
          total_fee: round(b.fin.totalFee),
          profit: round(b.fin.profitMarginAmount),
          margin_percent: b.fin.profitMarginPercent,
          fixed_fee: b.fin.isFixedFee,
          total_hours: round(phases.reduce((s, p) => s + p.hours, 0)),
          duration_weeks: phases.reduce((s, p) => s + (p.duration_weeks || 0), 0),
        },
        phases,
        payment_schedule: schedule,
        payment_schedule_check: {
          scheduled_amount: round(scheduled),
          unscheduled_amount: round(b.fin.totalFee - scheduled),
          scheduled_percent: round(b.fin.totalFee > 0 ? (scheduled / b.fin.totalFee) * 100 : 0),
        },
        ...(ctx.isAdmin ? {} : { note: 'Hourly rates per person are only shown to admins.' }),
      };
    },
  },
  {
    name: 'list_team',
    title: 'Team',
    description: 'Lists the team: name, position, category and whether internal or external. Admins also get monthly salary, overheads, cost per hour and non-billable share.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async (_args, ctx, data) => {
      const [members, categories] = await Promise.all([data.members(), data.categories()]);
      const cat = new Map(categories.map(c => [c.id, c]));
      return {
        currency: ctx.company.currency || 'USD',
        count: members.length,
        members: members.map(m => {
          const c = m.category ? cat.get(m.category) : undefined;
          const row: Json = {
            name: m.name,
            position: m.position,
            category: c?.name || null,
            group: c?.type === 'external' ? 'external' : 'internal',
            type: m.type,
          };
          if (ctx.isAdmin) {
            row.monthly_salary = round(m.salary || 0);
            row.monthly_overheads = round(m.overheads || 0);
            row.cost_per_hour = round(m.costPerHour || 0);
            row.non_billable_percent = m.nonBillablePercentage ?? 0;
          }
          return row;
        }),
      };
    },
  },
  {
    name: 'get_overheads',
    title: 'Overheads',
    description: 'Admins only. The overheads model: yearly cost of each overhead item by category, income target, working hours per year, and the monthly running cost (internal salaries plus overheads) used in the cash-flow forecast.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    adminOnly: true,
    run: async (_args, ctx, data) => {
      const o = await data.overheads();
      const rc = await runningCosts(data);
      const categories = (o?.categories || []).map(c => ({
        name: c.name,
        yearly_total: round((c.items || []).filter(i => i.isActive !== false).reduce((s, i) => s + (i.yearlyCost || 0), 0)),
        items: (c.items || []).map(i => ({ name: i.name, yearly_cost: round(i.yearlyCost || 0), active: i.isActive !== false })),
      }));
      return {
        currency: ctx.company.currency || 'USD',
        yearly_overheads: round(categories.reduce((s, c) => s + c.yearly_total, 0)),
        yearly_income_target: o?.yearlyIncomeTarget ?? null,
        working_hours_per_year: o?.workingHoursPerYear ?? null,
        overhead_per_person: o?.calculatedOverheadPerPerson ?? null,
        monthly_running_cost: { internal_salaries: rc.salaries, overheads: rc.overheads, total: rc.total },
        categories,
      };
    },
  },
  {
    name: 'get_cash_flow_forecast',
    title: 'Cash-flow forecast',
    description: 'Admins only. Month-by-month cash flow from the Financial forecast page. Inflows: invoiced (the invoicing schedule, not cash), possible (likely work, weighted by the conversion %), collections (cash expected in). Outflows: the fixed operational burn, other expense lines and referral commissions. Returns expected and optimistic inflow, net cash movement and closing bank cash per month. Optionally includes the amount of every line.',
    inputSchema: {
      type: 'object',
      properties: {
        from_month: { type: 'string', description: 'First month, YYYY-MM. Default: the current month.' },
        months: { type: 'integer', description: 'Number of months, 1–36. Default 12.' },
        include_lines: { type: 'boolean', description: 'Also return each inflow and outflow line per month. Default false.' },
      },
      additionalProperties: false,
    },
    adminOnly: true,
    run: async (args, ctx, data) => {
      const profile = await data.forecast();
      if (!profile) throw new ToolError('This company has not set up the Financial forecast yet.');
      const from = str(args, 'from_month') || currentMonth();
      if (!/^\d{4}-\d{2}$/.test(from)) throw new ToolError('from_month must look like 2026-11.');
      const count = int(args, 'months', 12, 1, 36);
      const includeLines = bool(args, 'include_lines', false);
      const rc = await runningCosts(data);
      const weight = (profile.possibleConversionPercent ?? 50) / 100;
      const opening = profile.openingMonthKey || profile.startMonthKey || currentMonth();
      const rows = profile.rows || [];
      const outflows = profile.outflows || [];
      const groupName = new Map((profile.groups || []).map(g => [g.id, g.name]));

      const sumStage = (m: string, stage: 'possible' | 'invoicing' | 'collections') =>
        rows.reduce((s, r) => s + (r.cells?.[m]?.[stage] || []).reduce((t, p) => t + (p.amount || 0), 0), 0);
      const referrals = (m: string) => {
        const out: Record<string, number> = {};
        rows.forEach(r => (r.cells?.[m]?.collections || []).forEach(p => {
          if (p.referralName?.trim()) out[p.referralName.trim()] = (out[p.referralName.trim()] || 0) + Math.round(p.amount * ((p.referralPercent || 0) / 100));
        }));
        return out;
      };
      const totals = (m: string) => {
        const collections = sumStage(m, 'collections');
        const possible = sumStage(m, 'possible');
        const lines = outflows.reduce((s, o) => s + outflowAmount(o, m, rc.total), 0);
        const ref = Object.values(referrals(m)).reduce((s, v) => s + v, 0);
        return { invoiced: sumStage(m, 'invoicing'), possible, collections, outflows: lines + ref, net: collections - lines - ref };
      };

      // Closing cash runs from the opening balance at the opening month, like the page
      const last = monthKey(from, count - 1);
      const start = monthIndex(opening) < monthIndex(from) ? opening : from;
      const closing: Record<string, number | null> = {};
      let cash = profile.startingBankBalance || 0;
      for (let i = 0; i <= monthIndex(last) - monthIndex(start); i++) {
        const m = monthKey(start, i);
        if (monthIndex(m) >= monthIndex(opening)) { cash += totals(m).net; closing[m] = round(cash); }
        else closing[m] = null;
      }

      const months = [];
      for (let i = 0; i < count; i++) {
        const m = monthKey(from, i);
        const t = totals(m);
        const row: Json = {
          month: m,
          invoiced: round(t.invoiced),
          possible: round(t.possible),
          collections: round(t.collections),
          expected_inflow: Math.round(t.collections + t.possible * weight),
          optimistic_inflow: round(t.collections + t.possible),
          outflows: round(t.outflows),
          net_cash: round(t.net),
          closing_bank_cash: closing[m] ?? null,
        };
        if (includeLines) {
          row.inflow_lines = rows
            .map(r => {
              const c: Partial<Record<'possible' | 'invoicing' | 'collections', { amount: number }[]>> = r.cells?.[m] || {};
              const s = (k: 'possible' | 'invoicing' | 'collections') => round((c[k] || []).reduce((t2, p) => t2 + (p.amount || 0), 0));
              return { line: r.name, group: r.groupId ? groupName.get(r.groupId) || null : null, invoiced: s('invoicing'), possible: s('possible'), collections: s('collections') };
            })
            .filter(l => l.invoiced || l.possible || l.collections);
          row.outflow_lines = [
            ...outflows.map(o => ({ line: o.name, group: o.groupId ? groupName.get(o.groupId) || null : null, amount: round(outflowAmount(o, m, rc.total)) })),
            ...Object.entries(referrals(m)).map(([name, amount]) => ({ line: `Referral: ${name}`, group: null, amount })),
          ].filter(l => l.amount);
        }
        months.push(row);
      }

      return {
        currency: ctx.company.currency || 'USD',
        opening_bank_cash: profile.startingBankBalance || 0,
        opening_month: opening,
        possible_weight_percent: Math.round(weight * 100),
        fixed_operational_burn_per_month: rc.total,
        notes: 'Closing bank cash moves only with collections minus outflows. Invoiced is the invoicing schedule and is not counted as cash. Expected inflow = collections + possible × weight.',
        months,
      };
    },
  },
];

export function toolsFor(ctx: McpContext): ToolDef[] {
  return TOOLS.filter(t => !t.adminOnly || ctx.isAdmin);
}

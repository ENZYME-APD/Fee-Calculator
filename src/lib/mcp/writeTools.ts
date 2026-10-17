import {
  Allocation, ForecastPill, ForecastProfile, ForecastRow, ForecastStage, Payment, Phase, Project, ProjectCost, TeamMember,
} from '@/lib/firebase/schema';
import { computePhaseCost, feeMultiplierFor } from '@/lib/utils/projectFinancials';
import { McpContext } from './auth';
import { applyChange, ChangeError, DocOp, listChanges, newId, undoChange } from './changes';
import { CompanyData, ToolDef, ToolError, bool, findProject, int, projectBundle, round, str } from './tools';

// Tools that change data. Offered only when the credential allows changes and the role isn't viewer;
// forecast edits also need an admin. Every call is one recorded change that can be undone.

type Json = Record<string, unknown>;
const STATUSES = ['Draft', 'Proposed', 'Active', 'Completed', 'Lost'];
const STAGES: Record<string, ForecastStage> = { invoiced: 'invoicing', invoicing: 'invoicing', possible: 'possible', collections: 'collections', collection: 'collections' };

export const strip = <T extends { id?: string }>(d: T): Omit<T, 'id'> => { const { id: _id, ...rest } = d; return rest; };

export function num(args: Json, key: string): number | undefined {
  const v = args[key];
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ToolError(`${key} must be a number.`);
  return n;
}

export function pick<T extends { id?: string; name: string }>(items: T[], ref: string, what: string, listHint: string): T {
  const r = ref.trim().toLowerCase();
  const exact = items.find(i => i.id === ref) || items.find(i => i.name.toLowerCase() === r);
  if (exact) return exact;
  const matches = items.filter(i => i.name.toLowerCase().includes(r));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new ToolError(`More than one ${what} matches "${ref}": ${matches.map(m => m.name).join('; ')}. Be more specific.`);
  throw new ToolError(`No ${what} matches "${ref}". ${listHint}`);
}

function parseDate(v: string | undefined): number | undefined {
  if (!v) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ToolError('Dates must look like 2026-11-30.');
  const t = Date.parse(`${v}T09:00:00Z`);
  if (Number.isNaN(t)) throw new ToolError(`${v} is not a valid date.`);
  return t;
}

function requireProject(p: Project) {
  if (p.isTemplate) throw new ToolError(`"${p.name}" is a template. Use create_project with this template to start a project from it.`);
}

async function totalsAfter(ctx: McpContext, projectId: string) {
  const data = new CompanyData(ctx.companyId); // fresh read, after the change
  const project = (await data.projects()).find(p => p.id === projectId);
  if (!project) return null;
  const b = await projectBundle(data, project);
  return {
    total_cost: round(b.fin.totalCost), total_fee: round(b.fin.totalFee),
    margin_percent: b.fin.profitMarginPercent, fixed_fee: b.fin.isFixedFee,
  };
}

export const done = (summary: string, changeId: string, extra: Json = {}) => ({
  done: summary, change_id: changeId, ...extra,
  undo: 'If this was not intended, call undo_change with this change_id.',
});

const projectArg = { type: 'string', description: 'Project id or name.' };
const phaseArg = { type: 'string', description: 'Phase id, name, or its number in the project (1 = first phase).' };

function findPhase(phases: Phase[], ref: string): Phase {
  if (/^\d+$/.test(ref.trim())) {
    const n = Number(ref.trim());
    if (n >= 1 && n <= phases.length) return phases[n - 1];
  }
  return pick(phases, ref, 'phase', 'Call get_project to see the phases.');
}

// ---------- forecast helpers ----------

export async function loadForecast(data: CompanyData): Promise<ForecastProfile & { id: string }> {
  const f = await data.forecast();
  if (!f?.id) throw new ToolError('This company has not set up the Financial forecast yet. Open it once in the app first.');
  return JSON.parse(JSON.stringify(f));
}

function findEntry(profile: ForecastProfile, entryId: string) {
  for (const row of profile.rows || []) {
    for (const [month, cell] of Object.entries(row.cells || {})) {
      for (const stage of ['invoicing', 'possible', 'collections'] as ForecastStage[]) {
        const list = cell[stage] || [];
        const i = list.findIndex(p => p.id === entryId);
        if (i >= 0) return { row, month, stage, index: i, pill: list[i] };
      }
    }
  }
  throw new ToolError(`No forecast entry has id "${entryId}". Call get_cash_flow_forecast with include_lines to see entry ids.`);
}

function findLine(profile: ForecastProfile, ref: string): ForecastRow {
  const rows = profile.rows || [];
  const hit = pick(rows.map(r => ({ id: r.id, name: r.name || '' })), ref, 'forecast line', 'Call get_cash_flow_forecast with include_lines to see the lines, or pass create_line: true.');
  return rows.find(r => r.id === hit.id)!; // the row inside the profile, so edits land in it
}

const pillId = () => `pill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
export const FORECAST_NOTE = 'If someone has the Financial forecast page open, ask them to reload it before editing, or their next save will replace this change.';

export function forecastOp(profile: ForecastProfile & { id: string }): DocOp {
  return { collection: 'forecastProfile', id: profile.id, data: { ...strip(profile), updatedAt: Date.now() } };
}

// ---------- tools ----------

export const WRITE_TOOLS: ToolDef[] = [
  {
    name: 'create_project',
    title: 'Create project',
    description: 'Creates a new project (fee proposal) with status Draft unless told otherwise. With a template, copies its phases, team allocations, direct costs and payment schedule; allocations are priced at the team\'s current hourly rates. Without a template the project starts empty: add phases next.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name.' },
        template: { type: 'string', description: 'Template id or name to start from (see list_projects with templates: true).' },
        status: { type: 'string', enum: STATUSES },
        start_date: { type: 'string', description: 'YYYY-MM-DD. Default: today.' },
        profit_margin: { type: 'number', description: 'Margin %. Default: the template\'s, or 30.' },
        description: { type: 'string' },
        area: { type: 'number', description: 'Floor area in the company\'s area unit.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const name = str(args, 'name');
      if (!name) throw new ToolError('Give the project a name.');
      const status = str(args, 'status') || 'Draft';
      if (!STATUSES.includes(status)) throw new ToolError(`Status must be one of ${STATUSES.join(', ')}.`);
      const templateRef = str(args, 'template');
      const template = templateRef
        ? pick((await data.projects()).filter(p => p.isTemplate), templateRef, 'template', 'Call list_projects with templates: true.')
        : null;
      const projectId = newId('projects');
      const project: Omit<Project, 'id'> = {
        companyId: ctx.companyId,
        name,
        description: str(args, 'description') ?? template?.description ?? '',
        profitMargin: num(args, 'profit_margin') ?? template?.profitMargin ?? 30,
        isTemplate: false,
        status,
        startDate: parseDate(str(args, 'start_date')) ?? Date.now(),
        ownerId: ctx.uid,
        createdAt: Date.now(),
        ...(num(args, 'area') !== undefined ? { area: num(args, 'area') } : template?.area ? { area: template.area } : {}),
      };
      const ops: DocOp[] = [{ collection: 'projects', id: projectId, data: project as Json }];
      let copied = '';
      if (template) {
        const b = await projectBundle(data, template);
        const rate = new Map(b.members.map(m => [m.id, m.costPerHour]));
        const phaseMap = new Map<string, string>();
        for (const ph of b.phases) {
          const id = newId('phases');
          phaseMap.set(ph.id!, id);
          ops.push({ collection: 'phases', id, data: { ...strip(ph), projectId } as Json });
        }
        for (const a of b.allocations) {
          const phaseId = phaseMap.get(a.phaseId);
          if (!phaseId) continue;
          ops.push({ collection: 'allocations', id: newId('allocations'), data: { ...strip(a), projectId, phaseId, costPerHourSnapshot: rate.get(a.memberId) ?? a.costPerHourSnapshot } as Json });
        }
        for (const c of b.costs) {
          const phaseId = phaseMap.get(c.phaseId);
          if (phaseId) ops.push({ collection: 'projectCosts', id: newId('projectCosts'), data: { ...strip(c), projectId, phaseId } as Json });
        }
        for (const p of b.payments) {
          ops.push({ collection: 'payments', id: newId('payments'), data: { ...strip(p), projectId, phaseId: p.phaseId ? phaseMap.get(p.phaseId) : undefined } as Json });
        }
        copied = ` from the template "${template.name}" (${b.phases.length} phases)`;
      }
      const changeId = await applyChange(ctx, 'create_project', `Created project "${name}"${copied}`, ops);
      return done(`Created "${name}"${copied}.`, changeId, { project_id: projectId, totals: await totalsAfter(ctx, projectId) });
    },
  },
  {
    name: 'update_project',
    title: 'Update project',
    description: 'Changes a project\'s name, description, status, start date, area, profit margin or fixed fee. Setting fixed_fee fixes the total fee and the margin is then calculated from it; set fixed_fee to 0 to go back to cost + margin.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        project: projectArg,
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: STATUSES },
        start_date: { type: 'string', description: 'YYYY-MM-DD' },
        area: { type: 'number' },
        profit_margin: { type: 'number', description: 'Margin % on top of cost. Ignored while a fixed fee is set.' },
        fixed_fee: { type: 'number', description: 'Agreed total fee. 0 switches the fixed fee off.' },
      },
      required: ['project'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const next: Json = { ...strip(project) };
      const changed: string[] = [];
      const name = str(args, 'name'); if (name) { next.name = name; changed.push(`name → ${name}`); }
      if (typeof args.description === 'string') { next.description = args.description; changed.push('description'); }
      const status = str(args, 'status');
      if (status) {
        if (!STATUSES.includes(status)) throw new ToolError(`Status must be one of ${STATUSES.join(', ')}.`);
        next.status = status; changed.push(`status → ${status}`);
      }
      const start = parseDate(str(args, 'start_date')); if (start) { next.startDate = start; changed.push(`start → ${str(args, 'start_date')}`); }
      const area = num(args, 'area'); if (area !== undefined) { next.area = area; changed.push(`area → ${area}`); }
      const margin = num(args, 'profit_margin'); if (margin !== undefined) { next.profitMargin = margin; changed.push(`margin → ${margin}%`); }
      const fixed = num(args, 'fixed_fee');
      if (fixed !== undefined) {
        if (fixed < 0) throw new ToolError('fixed_fee can\'t be negative.');
        next.fixedFee = fixed > 0 ? Math.round(fixed) : null;
        changed.push(fixed > 0 ? `fixed fee → ${Math.round(fixed)}` : 'fixed fee off');
      }
      if (!changed.length) throw new ToolError('Say what to change.');
      const changeId = await applyChange(ctx, 'update_project', `Updated "${project.name}": ${changed.join(', ')}`, [{ collection: 'projects', id: project.id!, data: next }]);
      return done(`Updated "${project.name}": ${changed.join(', ')}.`, changeId, { totals: await totalsAfter(ctx, project.id!) });
    },
  },
  {
    name: 'add_phase',
    title: 'Add phase',
    description: 'Adds a phase to a project, at the end or after a given phase.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        project: projectArg,
        name: { type: 'string' },
        duration_weeks: { type: 'number', description: 'Default 4.' },
        after_phase: { ...phaseArg, description: 'Insert after this phase. Default: at the end.' },
        description: { type: 'string' },
        deliverables: { type: 'string' },
      },
      required: ['project', 'name'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const name = str(args, 'name');
      if (!name) throw new ToolError('Give the phase a name.');
      const { phases } = await projectBundle(data, project);
      const afterRef = str(args, 'after_phase');
      const insertAt = afterRef ? phases.indexOf(findPhase(phases, afterRef)) + 1 : phases.length;
      const ops: DocOp[] = [];
      // Renumber so the new phase lands in place
      phases.forEach((ph, i) => {
        const order = i < insertAt ? i : i + 1;
        if (ph.order !== order) ops.push({ collection: 'phases', id: ph.id!, data: { ...strip(ph), order } as Json });
      });
      const id = newId('phases');
      const phase: Omit<Phase, 'id'> = {
        companyId: ctx.companyId, projectId: project.id!, name,
        description: str(args, 'description') || '', durationWeeks: num(args, 'duration_weeks') ?? 4, order: insertAt,
        ...(str(args, 'deliverables') ? { deliverables: str(args, 'deliverables') } : {}),
      };
      ops.push({ collection: 'phases', id, data: phase as Json });
      const changeId = await applyChange(ctx, 'add_phase', `Added phase "${name}" to "${project.name}"`, ops);
      return done(`Added phase ${insertAt + 1}, "${name}", to "${project.name}".`, changeId, { phase_id: id });
    },
  },
  {
    name: 'update_phase',
    title: 'Update phase',
    description: 'Changes a phase\'s name, duration, description, tasks, inclusions, omissions or deliverables.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        project: projectArg, phase: phaseArg,
        name: { type: 'string' }, duration_weeks: { type: 'number' }, description: { type: 'string' },
        tasks: { type: 'string' }, inclusions: { type: 'string' }, omissions: { type: 'string' }, deliverables: { type: 'string' },
      },
      required: ['project', 'phase'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const { phases } = await projectBundle(data, project);
      const phase = findPhase(phases, str(args, 'phase') || '');
      const next: Json = { ...strip(phase) };
      const changed: string[] = [];
      const name = str(args, 'name'); if (name) { next.name = name; changed.push(`name → ${name}`); }
      const weeks = num(args, 'duration_weeks');
      const ops: DocOp[] = [];
      if (weeks !== undefined) {
        if (weeks <= 0) throw new ToolError('duration_weeks must be more than 0.');
        next.durationWeeks = weeks; changed.push(`duration → ${weeks} weeks`);
        // Same as the app: hours given as a % of the phase follow its length (40 h weeks)
        const allocations = (await data.allocations()).filter(a => a.phaseId === phase.id && a.allocationType === 'percentage');
        for (const a of allocations) {
          ops.push({ collection: 'allocations', id: a.id!, data: { ...strip(a), hours: (a.allocationValue / 100) * weeks * 40 } as Json });
        }
        if (allocations.length) changed.push(`${allocations.length} percentage allocation${allocations.length > 1 ? 's' : ''} re-timed`);
      }
      for (const k of ['description', 'tasks', 'inclusions', 'omissions', 'deliverables']) {
        if (typeof args[k] === 'string') { next[k] = args[k]; changed.push(k); }
      }
      if (!changed.length) throw new ToolError('Say what to change.');
      ops.unshift({ collection: 'phases', id: phase.id!, data: next });
      const changeId = await applyChange(ctx, 'update_phase', `Updated phase "${phase.name}" in "${project.name}": ${changed.join(', ')}`, ops);
      return done(`Updated "${phase.name}": ${changed.join(', ')}.`, changeId, weeks !== undefined ? { totals: await totalsAfter(ctx, project.id!) } : {});
    },
  },
  {
    name: 'set_allocation',
    title: 'Set team hours',
    description: 'Sets how many hours a team member works on a phase. Creates the allocation if needed; 0 hours removes it. New allocations are priced at the member\'s current hourly rate; changing hours keeps the rate already agreed. Returns the phase cost and fee and the project totals afterwards.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        project: projectArg, phase: phaseArg,
        member: { type: 'string', description: 'Team member name (see list_team).' },
        hours: { type: 'number', description: 'Total hours on this phase. 0 removes the member from the phase.' },
      },
      required: ['project', 'phase', 'member', 'hours'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const b = await projectBundle(data, project);
      const phase = findPhase(b.phases, str(args, 'phase') || '');
      const member = pick<TeamMember>(b.members, str(args, 'member') || '', 'team member', 'Call list_team to see the names.');
      const hours = num(args, 'hours');
      if (hours === undefined || hours < 0) throw new ToolError('hours must be 0 or more.');
      const existing = b.allocations.find(a => a.phaseId === phase.id && a.memberId === member.id);
      let op: DocOp;
      let summary: string;
      if (hours === 0) {
        if (!existing) throw new ToolError(`${member.name} has no hours on "${phase.name}".`);
        op = { collection: 'allocations', id: existing.id!, data: null };
        summary = `Removed ${member.name} from "${phase.name}" (${project.name})`;
      } else if (existing) {
        op = { collection: 'allocations', id: existing.id!, data: { ...strip(existing), allocationType: 'hours', allocationValue: hours, hours } as Json };
        summary = `${member.name}: ${round(existing.hours)} → ${hours} h on "${phase.name}" (${project.name})`;
      } else {
        const alloc: Omit<Allocation, 'id'> = {
          companyId: ctx.companyId, projectId: project.id!, phaseId: phase.id!, memberId: member.id!,
          allocationType: 'hours', allocationValue: hours, hours, costPerHourSnapshot: member.costPerHour,
        };
        op = { collection: 'allocations', id: newId('allocations'), data: alloc as Json };
        summary = `Added ${member.name}, ${hours} h, to "${phase.name}" (${project.name})`;
      }
      const changeId = await applyChange(ctx, 'set_allocation', summary, [op]);
      const fresh = new CompanyData(ctx.companyId);
      const after = await projectBundle(fresh, project);
      const phaseCost = computePhaseCost(phase.id!, after.allocations, after.costs, after.members);
      return done(`${summary}.`, changeId, {
        phase: { name: phase.name, cost: round(phaseCost), fee: round(phaseCost * feeMultiplierFor(project, after.fin.totalCost)) },
        totals: await totalsAfter(ctx, project.id!),
      });
    },
  },
  {
    name: 'add_direct_cost',
    title: 'Add direct cost',
    description: 'Adds a direct cost (renderings, trips, consultants or other) to a phase.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        project: projectArg, phase: phaseArg,
        name: { type: 'string' },
        unit_cost: { type: 'number' },
        quantity: { type: 'number', description: 'Default 1.' },
        type: { type: 'string', enum: ['rendering', 'trip', 'consultant', 'other'], description: 'Default other.' },
      },
      required: ['project', 'phase', 'name', 'unit_cost'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const { phases } = await projectBundle(data, project);
      const phase = findPhase(phases, str(args, 'phase') || '');
      const name = str(args, 'name');
      const unitCost = num(args, 'unit_cost');
      const quantity = num(args, 'quantity') ?? 1;
      if (!name || unitCost === undefined) throw new ToolError('Give a name and a unit_cost.');
      const type = (str(args, 'type') || 'other') as ProjectCost['type'];
      if (!['rendering', 'trip', 'consultant', 'other'].includes(type)) throw new ToolError('type must be rendering, trip, consultant or other.');
      const cost: Omit<ProjectCost, 'id'> = { companyId: ctx.companyId, projectId: project.id!, phaseId: phase.id!, type, name, quantity, unitCost };
      const changeId = await applyChange(ctx, 'add_direct_cost', `Added ${name} (${quantity} × ${unitCost}) to "${phase.name}" (${project.name})`, [{ collection: 'projectCosts', id: newId('projectCosts'), data: cost as Json }]);
      return done(`Added ${name} to "${phase.name}".`, changeId, { totals: await totalsAfter(ctx, project.id!) });
    },
  },
  {
    name: 'remove_direct_cost',
    title: 'Remove direct cost',
    description: 'Removes a direct cost from a project.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: { project: projectArg, cost: { type: 'string', description: 'Name of the direct cost.' }, phase: { ...phaseArg, description: 'Only needed if several phases have a cost with that name.' } },
      required: ['project', 'cost'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const b = await projectBundle(data, project);
      const phaseRef = str(args, 'phase');
      const pool = phaseRef ? b.costs.filter(c => c.phaseId === findPhase(b.phases, phaseRef).id) : b.costs;
      const cost = pick(pool, str(args, 'cost') || '', 'direct cost', 'Call get_project to see the direct costs.');
      const changeId = await applyChange(ctx, 'remove_direct_cost', `Removed ${cost.name} from "${project.name}"`, [{ collection: 'projectCosts', id: cost.id!, data: null }]);
      return done(`Removed ${cost.name}.`, changeId, { totals: await totalsAfter(ctx, project.id!) });
    },
  },
  {
    name: 'set_payment_schedule',
    title: 'Set payment schedule',
    description: 'Replaces a project\'s payment schedule. Each milestone has either a percent of the fee, or a fixed amount (its percent is then worked out from the fee). Percentages should add up to 100 with the fixed amounts included.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        project: projectArg,
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phase: { ...phaseArg, description: 'Optional phase this milestone is tied to.' },
              percent: { type: 'number' },
              amount: { type: 'number' },
            },
            required: ['name'],
          },
        },
      },
      required: ['project', 'milestones'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const project = await findProject(data, str(args, 'project') || '');
      requireProject(project);
      const b = await projectBundle(data, project);
      const list = Array.isArray(args.milestones) ? (args.milestones as Json[]) : [];
      if (!list.length) throw new ToolError('Give at least one milestone.');
      const fee = b.fin.totalFee;
      const ops: DocOp[] = b.payments.map(p => ({ collection: 'payments', id: p.id!, data: null }));
      let pct = 0;
      list.forEach((m, i) => {
        const name = str(m, 'name');
        if (!name) throw new ToolError(`Milestone ${i + 1} needs a name.`);
        const percent = num(m, 'percent');
        const amount = num(m, 'amount');
        if ((percent === undefined) === (amount === undefined)) throw new ToolError(`"${name}": give either a percent or an amount.`);
        const phaseRef = str(m, 'phase');
        const phaseId = phaseRef ? findPhase(b.phases, phaseRef).id : undefined;
        const payment: Omit<Payment, 'id'> = amount !== undefined
          ? { companyId: ctx.companyId, projectId: project.id!, phaseId, name, order: i, amount: Math.round(amount), percentage: fee > 0 ? round((amount / fee) * 100) : 0 }
          : { companyId: ctx.companyId, projectId: project.id!, phaseId, name, order: i, percentage: percent!, amount: null };
        pct += payment.percentage;
        ops.push({ collection: 'payments', id: newId('payments'), data: payment as Json });
      });
      const changeId = await applyChange(ctx, 'set_payment_schedule', `Set ${list.length} payment milestones on "${project.name}"`, ops);
      return done(`Set ${list.length} milestones on "${project.name}".`, changeId, {
        scheduled_percent: round(pct),
        ...(Math.abs(pct - 100) > 0.5 ? { warning: `The milestones add up to ${round(pct)}% of the fee, not 100%.` } : {}),
      });
    },
  },
  {
    name: 'add_forecast_entry',
    title: 'Add forecast entry',
    description: `Admins only. Adds an amount to a line of the Financial forecast in a month and stage: invoiced (the invoicing schedule, never counted as cash), possible (likely, weighted) or collections (cash expected in). ${FORECAST_NOTE}`,
    writes: true,
    adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        line: { type: 'string', description: 'Inflow line name or line_id.' },
        month: { type: 'string', description: 'YYYY-MM' },
        stage: { type: 'string', enum: ['invoiced', 'possible', 'collections'] },
        amount: { type: 'number' },
        label: { type: 'string', description: 'e.g. "Invoice 3 of 5" or "Stage 2 payment".' },
        notes: { type: 'string' },
        create_line: { type: 'boolean', description: 'Create a new income line with this name if none matches. Default false.' },
      },
      required: ['line', 'month', 'stage', 'amount'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const month = str(args, 'month') || '';
      if (!/^\d{4}-\d{2}$/.test(month)) throw new ToolError('month must look like 2026-11.');
      const stage = STAGES[(str(args, 'stage') || '').toLowerCase()];
      if (!stage) throw new ToolError('stage must be invoiced, possible or collections.');
      const amount = num(args, 'amount');
      if (amount === undefined) throw new ToolError('Give an amount.');
      const lineRef = str(args, 'line') || '';
      let row: ForecastRow;
      try { row = findLine(profile, lineRef); }
      catch (e) {
        if (!bool(args, 'create_line', false)) throw e;
        row = { id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: lineRef, type: 'external', cells: {} };
        profile.rows = [...(profile.rows || []), row];
      }
      const pill: ForecastPill = { id: pillId(), amount: Math.round(amount), label: str(args, 'label') || '', ...(str(args, 'notes') ? { notes: str(args, 'notes') } : {}) };
      row.cells = row.cells || {};
      row.cells[month] = row.cells[month] || {};
      row.cells[month][stage] = [...(row.cells[month][stage] || []), pill];
      const stageName = stage === 'invoicing' ? 'invoiced' : stage;
      const changeId = await applyChange(ctx, 'add_forecast_entry', `Forecast: added ${pill.amount} to ${row.name}, ${month} ${stageName}`, [forecastOp(profile)]);
      return done(`Added ${pill.amount} to "${row.name}" in ${month} (${stageName}).`, changeId, { entry_id: pill.id, note: FORECAST_NOTE });
    },
  },
  {
    name: 'edit_forecast_entry',
    title: 'Edit or move forecast entry',
    description: `Admins only. Changes a forecast entry's amount, label or notes, and/or moves it to another month, stage or line. With copy: true the original stays and a copy is placed instead (for example copying an invoice into collections in the month it is expected to be paid). ${FORECAST_NOTE}`,
    writes: true,
    adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        entry_id: { type: 'string', description: 'From get_cash_flow_forecast with include_lines.' },
        amount: { type: 'number' }, label: { type: 'string' }, notes: { type: 'string' },
        to_month: { type: 'string', description: 'YYYY-MM' },
        to_stage: { type: 'string', enum: ['invoiced', 'possible', 'collections'] },
        to_line: { type: 'string', description: 'Line name or line_id.' },
        copy: { type: 'boolean', description: 'Keep the original and place a copy. Default false.' },
      },
      required: ['entry_id'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const found = findEntry(profile, str(args, 'entry_id') || '');
      const toMonth = str(args, 'to_month') || found.month;
      if (!/^\d{4}-\d{2}$/.test(toMonth)) throw new ToolError('to_month must look like 2026-11.');
      const toStageArg = str(args, 'to_stage');
      const toStage = toStageArg ? STAGES[toStageArg.toLowerCase()] : found.stage;
      if (!toStage) throw new ToolError('to_stage must be invoiced, possible or collections.');
      const toRow = str(args, 'to_line') ? findLine(profile, str(args, 'to_line')!) : found.row;
      const copy = bool(args, 'copy', false);
      const amount = num(args, 'amount');
      const pill: ForecastPill = {
        ...found.pill,
        ...(copy ? { id: pillId() } : {}),
        ...(amount !== undefined ? { amount: Math.round(amount) } : {}),
        ...(typeof args.label === 'string' ? { label: args.label } : {}),
        ...(typeof args.notes === 'string' ? { notes: args.notes } : {}),
      };
      if (!copy) found.row.cells[found.month][found.stage] = (found.row.cells[found.month][found.stage] || []).filter(p => p.id !== found.pill.id);
      toRow.cells[toMonth] = toRow.cells[toMonth] || {};
      toRow.cells[toMonth][toStage] = [...(toRow.cells[toMonth][toStage] || []), pill];
      const where = `${toRow.name}, ${toMonth} ${toStage === 'invoicing' ? 'invoiced' : toStage}`;
      const summary = `Forecast: ${copy ? 'copied' : 'updated'} ${found.pill.label || found.pill.amount} → ${where}${amount !== undefined ? `, amount ${pill.amount}` : ''}`;
      const changeId = await applyChange(ctx, 'edit_forecast_entry', summary, [forecastOp(profile)]);
      return done(summary + '.', changeId, { entry_id: pill.id, note: FORECAST_NOTE });
    },
  },
  {
    name: 'remove_forecast_entry',
    title: 'Remove forecast entry',
    description: `Admins only. Removes one entry from the Financial forecast. ${FORECAST_NOTE}`,
    writes: true,
    adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { entry_id: { type: 'string' } },
      required: ['entry_id'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const found = findEntry(profile, str(args, 'entry_id') || '');
      found.row.cells[found.month][found.stage] = (found.row.cells[found.month][found.stage] || []).filter(p => p.id !== found.pill.id);
      const summary = `Forecast: removed ${found.pill.amount}${found.pill.label ? ` (${found.pill.label})` : ''} from ${found.row.name}, ${found.month}`;
      const changeId = await applyChange(ctx, 'remove_forecast_entry', summary, [forecastOp(profile)]);
      return done(summary + '.', changeId, { note: FORECAST_NOTE });
    },
  },
  {
    name: 'list_recent_changes',
    title: 'Recent changes',
    description: 'Lists the latest changes made through the AI connection, newest first, with their change_id and whether they were undone. Admins see everyone\'s changes; others see their own.',
    writes: true,
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', description: 'Default 10, max 50.' } }, additionalProperties: false },
    run: async (args, ctx) => {
      const list = await listChanges(ctx.companyId, { uid: ctx.isAdmin ? undefined : ctx.uid, limit: int(args, 'limit', 10, 1, 50) });
      return {
        changes: list.map(c => ({
          change_id: c.id, when: new Date(c.createdAt).toISOString(), who: c.who, via: c.client, summary: c.summary,
          undone: !!c.undoneAt,
        })),
      };
    },
  },
  {
    name: 'undo_change',
    title: 'Undo a change',
    description: 'Reverts a change made through the AI connection, restoring everything it touched. Without a change_id, undoes your most recent change that is not already undone. Refuses if those records have been edited since.',
    writes: true,
    inputSchema: { type: 'object', properties: { change_id: { type: 'string' } }, additionalProperties: false },
    run: async (args, ctx) => {
      let id = str(args, 'change_id');
      if (!id) {
        const latest = (await listChanges(ctx.companyId, { uid: ctx.uid, limit: 50 })).find(c => !c.undoneAt);
        if (!latest) throw new ToolError('You have no changes to undo.');
        id = latest.id;
      }
      try {
        const change = await undoChange(ctx, id);
        return { done: `Undone: ${change.summary}.` };
      } catch (e) {
        if (e instanceof ChangeError) throw new ToolError(e.message);
        throw e;
      }
    },
  },
];

import { ForecastOutflowItem, OverheadCategory, OverheadsProfile, TeamCategory, TeamMember } from '@/lib/firebase/schema';
import { applyChange, DocOp, newId } from './changes';
import { CompanyData, ToolDef, ToolError, bool, isLinkedLine, round, runningCosts, str } from './tools';
import { FORECAST_NOTE, done, forecastOp, loadForecast, num, pick, strip } from './writeTools';

// Admin-only changes to the team, the overheads model and forecast expense lines. Same rules as
// the app: an hour costs (monthly salary + monthly overheads) / 160; overheads only reach people's
// rates when they are synced (sync_overheads_to_team), and existing allocations keep the rate that
// was agreed when they were made.

type Json = Record<string, unknown>;
const HOURS_PER_MONTH = 160;
const MEMBER_TYPES = ['Employee', 'Consultant'];
const TEAM_NOTE = 'Existing allocations keep the hourly rate agreed when they were made; only new allocations use the new rate. An admin can re-pull rates with the refresh button next to Total cost on a project.';
const OVERHEADS_NOTE = 'If someone has the Overheads calculator open, ask them to reload it before editing, or their next save will replace this change.';

const rate = (salary: number, overheads: number) => round((salary + overheads) / HOURS_PER_MONTH);
const isExternal = (m: TeamMember, cats: TeamCategory[]) => cats.find(c => c.id === m.category)?.type === 'external';

function findCategory(cats: TeamCategory[], ref: string): TeamCategory {
  return pick(cats.map(c => ({ ...c, name: c.name || '' })), ref, 'team category', 'Call list_team to see the categories.');
}

/** The overheads page's figures: yearly overheads (non-billable internal salary + active items) and per-person shares. */
function overheadStats(members: TeamMember[], cats: TeamCategory[], categories: OverheadCategory[]) {
  let nonBillable = 0;
  members.forEach(m => { if (!isExternal(m, cats)) nonBillable += (m.salary || 0) * 12 * ((m.nonBillablePercentage || 0) / 100); });
  const items = categories.flatMap(c => c.items || []).filter(i => i.isActive !== false).reduce((s, i) => s + (i.yearlyCost || 0), 0);
  const yearly = nonBillable + items;
  const core = members.filter(m => !isExternal(m, cats));
  return {
    yearly,
    storedPerPerson: members.length ? yearly / 12 / members.length : 0, // what the page stores as calculatedOverheadPerPerson
    syncPerPerson: core.length ? yearly / 12 / core.length : 0, // what "sync to team" gives each internal member
    core,
  };
}

async function loadOverheads(data: CompanyData, ctx: { companyId: string }): Promise<OverheadsProfile & { id: string }> {
  const o = await data.overheads();
  if (o?.id) return JSON.parse(JSON.stringify(o));
  return { id: newId('overheadsProfile'), companyId: ctx.companyId, yearlyIncomeTarget: 0, workingHoursPerYear: 1832, categories: [], updatedAt: Date.now() };
}

async function overheadsOp(data: CompanyData, profile: OverheadsProfile & { id: string }): Promise<DocOp> {
  const [members, cats] = await Promise.all([data.members(), data.categories()]);
  const stats = overheadStats(members, cats, profile.categories || []);
  return { collection: 'overheadsProfile', id: profile.id, data: { ...strip(profile), calculatedOverheadPerPerson: stats.storedPerPerson, updatedAt: Date.now() } as Json };
}

const itemId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const opillId = () => `opill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

function findOutflow(lines: ForecastOutflowItem[], ref: string): ForecastOutflowItem {
  const hit = pick(lines.map(l => ({ id: l.id, name: l.name || '' })), ref, 'outflow line', 'Call get_cash_flow_forecast with include_lines to see the outflow lines.');
  return lines.find(l => l.id === hit.id)!;
}

function checkMonth(m: string | undefined, key = 'month'): string {
  if (!m || !/^\d{4}-\d{2}$/.test(m)) throw new ToolError(`${key} must look like 2026-11.`);
  return m;
}

const memberProps = {
  position: { type: 'string', description: 'Job title, e.g. Senior architect.' },
  type: { type: 'string', enum: MEMBER_TYPES, description: 'Employee or Consultant.' },
  monthly_salary: { type: 'number', description: 'Monthly salary (or monthly fee for a consultant).' },
  monthly_overheads: { type: 'number', description: 'Monthly overheads carried by this person. Setting it stops overhead syncs from changing it.' },
  category: { type: 'string', description: 'Team category name (see list_team).' },
  non_billable_percent: { type: 'number', description: 'Share of time that is not billable, 0–100.' },
};

export const ADMIN_WRITE_TOOLS: ToolDef[] = [
  // ---------- team ----------
  {
    name: 'add_team_member',
    title: 'Add team member',
    description: 'Admins only. Adds a person to Team resources. Their cost per hour is (monthly salary + monthly overheads) / 160. Without monthly_overheads, internal members get the current per-person overhead share from the Overheads calculator.',
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Full name.' }, ...memberProps },
      required: ['name', 'position', 'monthly_salary'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const name = str(args, 'name'), position = str(args, 'position');
      const salary = num(args, 'monthly_salary');
      if (!name || !position || salary === undefined || salary < 0) throw new ToolError('Give a name, position and a monthly_salary of 0 or more.');
      const type = str(args, 'type') || 'Employee';
      if (!MEMBER_TYPES.includes(type)) throw new ToolError('type must be Employee or Consultant.');
      const [members, cats, profile] = await Promise.all([data.members(), data.categories(), data.overheads()]);
      if (members.some(m => m.name.toLowerCase() === name.toLowerCase())) throw new ToolError(`There is already a team member called ${name}. Use update_team_member to change them.`);
      const catRef = str(args, 'category');
      const category = catRef ? findCategory(cats, catRef) : undefined;
      const external = category?.type === 'external';
      const given = num(args, 'monthly_overheads');
      const overheads = given ?? (external ? 0 : Math.round(overheadStats([...members, { salary, category: category?.id } as TeamMember], cats, profile?.categories || []).syncPerPerson));
      const nb = num(args, 'non_billable_percent');
      if (nb !== undefined && (nb < 0 || nb > 100)) throw new ToolError('non_billable_percent must be between 0 and 100.');
      const member: Omit<TeamMember, 'id'> = {
        companyId: ctx.companyId, name, position, type, salary, overheads, costPerHour: rate(salary, overheads),
        currency: ctx.company.currency || 'USD',
        ...(category ? { category: category.id } : {}),
        ...(nb !== undefined ? { nonBillablePercentage: nb } : {}),
        ...(given !== undefined ? { isOverheadsManuallyOverridden: true } : {}),
      };
      const id = newId('teamMembers');
      const changeId = await applyChange(ctx, 'add_team_member', `Added ${name} (${position}) to the team`, [{ collection: 'teamMembers', id, data: member as Json }]);
      return done(`Added ${name}.`, changeId, { member: { name, position, category: category?.name || null, monthly_salary: salary, monthly_overheads: overheads, cost_per_hour: member.costPerHour } });
    },
  },
  {
    name: 'update_team_member',
    title: 'Update team member',
    description: `Admins only. Changes a team member's name, position, type, salary, overheads, category or non-billable share. The cost per hour is recalculated when salary or overheads change. ${TEAM_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { member: { type: 'string', description: 'Current name of the team member.' }, name: { type: 'string', description: 'New name.' }, ...memberProps },
      required: ['member'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const [members, cats] = await Promise.all([data.members(), data.categories()]);
      const m = pick(members, str(args, 'member') || '', 'team member', 'Call list_team to see the names.');
      const next: Json = { ...strip(m) };
      const changed: string[] = [];
      const name = str(args, 'name'); if (name) { next.name = name; changed.push(`name → ${name}`); }
      const position = str(args, 'position'); if (position) { next.position = position; changed.push(`position → ${position}`); }
      const type = str(args, 'type');
      if (type) { if (!MEMBER_TYPES.includes(type)) throw new ToolError('type must be Employee or Consultant.'); next.type = type; changed.push(`type → ${type}`); }
      const salary = num(args, 'monthly_salary');
      if (salary !== undefined) { if (salary < 0) throw new ToolError('monthly_salary can\'t be negative.'); next.salary = salary; changed.push(`salary ${m.salary} → ${salary}`); }
      const overheads = num(args, 'monthly_overheads');
      if (overheads !== undefined) {
        if (overheads < 0) throw new ToolError('monthly_overheads can\'t be negative.');
        next.overheads = overheads; next.isOverheadsManuallyOverridden = true; changed.push(`overheads ${m.overheads} → ${overheads}`);
      }
      const catRef = str(args, 'category'); if (catRef) { const c = findCategory(cats, catRef); next.category = c.id; changed.push(`category → ${c.name}`); }
      const nb = num(args, 'non_billable_percent');
      if (nb !== undefined) { if (nb < 0 || nb > 100) throw new ToolError('non_billable_percent must be between 0 and 100.'); next.nonBillablePercentage = nb; changed.push(`non-billable → ${nb}%`); }
      if (!changed.length) throw new ToolError('Say what to change.');
      if (salary !== undefined || overheads !== undefined) {
        next.costPerHour = rate(Number(next.salary) || 0, Number(next.overheads) || 0);
        changed.push(`cost per hour ${round(m.costPerHour)} → ${next.costPerHour}`);
      }
      const changeId = await applyChange(ctx, 'update_team_member', `Updated ${m.name}: ${changed.join(', ')}`, [{ collection: 'teamMembers', id: m.id!, data: next }]);
      return done(`Updated ${m.name}: ${changed.join(', ')}.`, changeId, { note: TEAM_NOTE });
    },
  },

  // ---------- overheads ----------
  {
    name: 'set_overhead_item',
    title: 'Add or change an overhead',
    description: `Admins only. Adds an overhead item (rent, software, insurance…) to a category of the Overheads calculator, or changes an existing one's yearly cost, name or whether it is active. Creates the category if it doesn't exist. Rates only change after sync_overheads_to_team. ${OVERHEADS_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Overhead category name, e.g. Office.' },
        item: { type: 'string', description: 'Item name, e.g. Rent.' },
        yearly_cost: { type: 'number', description: 'Cost per year.' },
        active: { type: 'boolean', description: 'Inactive items stay listed but don\'t count. Default true for new items.' },
        new_name: { type: 'string', description: 'Rename the item.' },
      },
      required: ['category', 'item'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadOverheads(data, ctx);
      const catName = str(args, 'category') || '';
      const itemName = str(args, 'item') || '';
      if (!catName || !itemName) throw new ToolError('Give a category and an item.');
      profile.categories = profile.categories || [];
      let cat = profile.categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      let createdCat = false;
      if (!cat) { cat = { id: `cat_${Date.now()}`, name: catName, items: [] }; profile.categories.push(cat); createdCat = true; }
      cat.items = cat.items || [];
      const cost = num(args, 'yearly_cost');
      if (cost !== undefined && cost < 0) throw new ToolError('yearly_cost can\'t be negative.');
      let item = cat.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      let summary: string;
      if (!item) {
        if (cost === undefined) throw new ToolError(`"${itemName}" is new: give its yearly_cost.`);
        item = { id: itemId(), name: str(args, 'new_name') || itemName, yearlyCost: cost, isActive: bool(args, 'active', true) };
        cat.items.push(item);
        summary = `Overheads: added ${item.name} (${cost}/year) to ${cat.name}${createdCat ? ' (new category)' : ''}`;
      } else {
        const changed: string[] = [];
        if (cost !== undefined) { changed.push(`${item.yearlyCost} → ${cost}/year`); item.yearlyCost = cost; }
        if (typeof args.active === 'boolean') { item.isActive = args.active; changed.push(args.active ? 'active' : 'inactive'); }
        const rename = str(args, 'new_name'); if (rename) { changed.push(`renamed to ${rename}`); item.name = rename; }
        if (!changed.length) throw new ToolError('Say what to change.');
        summary = `Overheads: ${itemName} in ${cat.name}: ${changed.join(', ')}`;
      }
      const changeId = await applyChange(ctx, 'set_overhead_item', summary, [await overheadsOp(data, profile)]);
      return done(summary + '.', changeId, { note: `Hourly rates are unchanged until sync_overheads_to_team. ${OVERHEADS_NOTE}` });
    },
  },
  {
    name: 'remove_overhead_item',
    title: 'Remove an overhead',
    description: `Admins only. Removes an overhead item from the Overheads calculator. To keep it but stop counting it, use set_overhead_item with active: false. ${OVERHEADS_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { category: { type: 'string' }, item: { type: 'string' } },
      required: ['category', 'item'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadOverheads(data, ctx);
      const cat = pick((profile.categories || []).map(c => ({ ...c })), str(args, 'category') || '', 'overhead category', 'Call get_overheads to see them.');
      const real = profile.categories.find(c => c.id === cat.id)!;
      const item = pick(real.items || [], str(args, 'item') || '', 'overhead item', 'Call get_overheads to see them.');
      real.items = real.items.filter(i => i.id !== item.id);
      const summary = `Overheads: removed ${item.name} (${item.yearlyCost}/year) from ${real.name}`;
      const changeId = await applyChange(ctx, 'remove_overhead_item', summary, [await overheadsOp(data, profile)]);
      return done(summary + '.', changeId, { note: `Hourly rates are unchanged until sync_overheads_to_team. ${OVERHEADS_NOTE}` });
    },
  },
  {
    name: 'update_overheads_settings',
    title: 'Overheads targets',
    description: `Admins only. Sets the yearly income target and the working hours per year in the Overheads calculator. ${OVERHEADS_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { yearly_income_target: { type: 'number' }, working_hours_per_year: { type: 'number' } },
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadOverheads(data, ctx);
      const changed: string[] = [];
      const target = num(args, 'yearly_income_target');
      if (target !== undefined) { if (target < 0) throw new ToolError('yearly_income_target can\'t be negative.'); changed.push(`income target ${profile.yearlyIncomeTarget} → ${target}`); profile.yearlyIncomeTarget = target; }
      const hours = num(args, 'working_hours_per_year');
      if (hours !== undefined) { if (hours <= 0 || hours > 8760) throw new ToolError('working_hours_per_year must be between 1 and 8760.'); changed.push(`working hours ${profile.workingHoursPerYear} → ${hours}`); profile.workingHoursPerYear = hours; }
      if (!changed.length) throw new ToolError('Say what to change.');
      const summary = `Overheads: ${changed.join(', ')}`;
      const changeId = await applyChange(ctx, 'update_overheads_settings', summary, [await overheadsOp(data, profile)]);
      return done(summary + '.', changeId, { note: OVERHEADS_NOTE });
    },
  },
  {
    name: 'sync_overheads_to_team',
    title: 'Sync overheads to rates',
    description: `Admins only. Same as "Sync to team" in the Overheads calculator: shares the yearly overheads equally across internal team members and recalculates their cost per hour. Members whose overheads were set by hand are left alone. ${TEAM_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async (_args, ctx, data) => {
      const [members, cats, profile] = await Promise.all([data.members(), data.categories(), data.overheads()]);
      const stats = overheadStats(members, cats, profile?.categories || []);
      const share = Math.round(stats.syncPerPerson);
      const targets = stats.core.filter(m => !m.isOverheadsManuallyOverridden);
      const ops: DocOp[] = targets
        .filter(m => m.overheads !== share || round(m.costPerHour) !== rate(m.salary || 0, share))
        .map(m => ({ collection: 'teamMembers', id: m.id!, data: { ...strip(m), overheads: share, costPerHour: rate(m.salary || 0, share) } as Json }));
      if (!ops.length) return { done: `Nothing to change: internal members already carry ${share} a month in overheads.`, overheads_per_person_per_month: share };
      const changeId = await applyChange(ctx, 'sync_overheads_to_team', `Synced overheads to ${ops.length} team members (${share}/month each)`, ops);
      return done(`Set ${ops.length} internal team members to ${share} a month in overheads and recalculated their rates.`, changeId, {
        overheads_per_person_per_month: share,
        skipped_manual: stats.core.filter(m => m.isOverheadsManuallyOverridden).map(m => m.name),
        note: TEAM_NOTE,
      });
    },
  },

  // ---------- forecast outflows ----------
  {
    name: 'add_outflow_line',
    title: 'Add outflow line',
    description: `Admins only. Adds an expense line to the Outflows of the Financial forecast (a loan, a partner draw, a recurring cost…), optionally with an amount that repeats every month. ${FORECAST_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        every_month_amount: { type: 'number', description: 'Amount that applies to every month without its own expenses.' },
        group: { type: 'string', description: 'Forecast group name to put it in.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const name = str(args, 'name');
      if (!name) throw new ToolError('Give the line a name.');
      const groupRef = str(args, 'group');
      const group = groupRef ? pick(profile.groups || [], groupRef, 'forecast group', 'Groups are managed on the forecast page.') : undefined;
      const every = num(args, 'every_month_amount');
      const line: ForecastOutflowItem = {
        id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name, type: 'custom', monthlyAmounts: {}, monthlyPills: {},
        ...(every ? { defaultMonthlyAmount: Math.round(every) } : {}),
        ...(group ? { groupId: group.id } : {}),
      };
      profile.outflows = [...(profile.outflows || []), line];
      const summary = `Forecast: added outflow line "${name}"${every ? ` (${Math.round(every)} every month)` : ''}`;
      const changeId = await applyChange(ctx, 'add_outflow_line', summary, [forecastOp(profile)]);
      return done(summary + '.', changeId, { line_id: line.id, note: FORECAST_NOTE });
    },
  },
  {
    name: 'add_outflow_expense',
    title: 'Add outflow expense',
    description: `Admins only. Adds an expense with an optional description to an outflow line in a month. A month's expenses replace the line's every-month amount for that month. Not for the fixed operational burn, which follows Team resources and Overheads: use set_outflow_adjustment for that. ${FORECAST_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        line: { type: 'string', description: 'Outflow line name or line_id.' },
        month: { type: 'string', description: 'YYYY-MM' },
        amount: { type: 'number' },
        description: { type: 'string', description: 'e.g. "Instalment 3 of 6".' },
      },
      required: ['line', 'month', 'amount'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const line = findOutflow(profile.outflows || [], str(args, 'line') || '');
      if (isLinkedLine(line)) throw new ToolError(`"${line.name}" follows Team resources and Overheads. Use set_outflow_adjustment to add or subtract an amount in a month.`);
      const month = checkMonth(str(args, 'month'));
      const amount = num(args, 'amount');
      if (amount === undefined) throw new ToolError('Give an amount.');
      line.monthlyPills = line.monthlyPills || {};
      // Older lines stored one number per month: keep it as an expense so it isn't lost
      if (!line.monthlyPills[month]?.length && line.monthlyAmounts?.[month]) {
        line.monthlyPills[month] = [{ id: opillId(), amount: Math.round(line.monthlyAmounts[month]) }];
        delete line.monthlyAmounts[month];
      }
      const replacesDefault = !line.monthlyPills[month]?.length && !!line.defaultMonthlyAmount;
      const pill = { id: opillId(), amount: Math.round(amount), ...(str(args, 'description') ? { description: str(args, 'description') } : {}) };
      line.monthlyPills[month] = [...(line.monthlyPills[month] || []), pill];
      const summary = `Forecast: added ${pill.amount} to "${line.name}" in ${month}`;
      const changeId = await applyChange(ctx, 'add_outflow_expense', summary, [forecastOp(profile)]);
      return done(summary + '.', changeId, {
        expense_id: pill.id,
        ...(replacesDefault ? { warning: `This month's expenses now replace the every-month amount of ${line.defaultMonthlyAmount}. Add it as an expense too if it still applies.` } : {}),
        note: FORECAST_NOTE,
      });
    },
  },
  {
    name: 'remove_outflow_expense',
    title: 'Remove outflow expense',
    description: `Admins only. Removes one expense from an outflow line. ${FORECAST_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { line: { type: 'string', description: 'Outflow line name or line_id.' }, month: { type: 'string', description: 'YYYY-MM' }, expense_id: { type: 'string', description: 'From get_cash_flow_forecast with include_lines.' } },
      required: ['line', 'month', 'expense_id'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const line = findOutflow(profile.outflows || [], str(args, 'line') || '');
      const month = checkMonth(str(args, 'month'));
      const list = line.monthlyPills?.[month] || [];
      const pill = list.find(p => p.id === str(args, 'expense_id'));
      if (!pill) throw new ToolError(`No expense with that id in "${line.name}" for ${month}.`);
      const rest = list.filter(p => p.id !== pill.id);
      if (rest.length) line.monthlyPills![month] = rest; else delete line.monthlyPills![month];
      const summary = `Forecast: removed ${pill.amount}${pill.description ? ` (${pill.description})` : ''} from "${line.name}" in ${month}`;
      const changeId = await applyChange(ctx, 'remove_outflow_expense', summary, [forecastOp(profile)]);
      return done(summary + '.', changeId, { note: FORECAST_NOTE });
    },
  },
  {
    name: 'set_outflow_adjustment',
    title: 'Adjust outflow in a month',
    description: `Admins only. Sets a + or − correction on an outflow line for one month, on top of its amount (for example a bonus month on the fixed operational burn). 0 clears it. ${FORECAST_NOTE}`,
    writes: true, adminOnly: true,
    inputSchema: {
      type: 'object',
      properties: { line: { type: 'string', description: 'Outflow line name or line_id.' }, month: { type: 'string', description: 'YYYY-MM' }, amount: { type: 'number', description: 'Positive adds cost, negative reduces it.' } },
      required: ['line', 'month', 'amount'],
      additionalProperties: false,
    },
    run: async (args, ctx, data) => {
      const profile = await loadForecast(data);
      const line = findOutflow(profile.outflows || [], str(args, 'line') || '');
      const month = checkMonth(str(args, 'month'));
      const amount = num(args, 'amount');
      if (amount === undefined) throw new ToolError('Give an amount (0 clears the adjustment).');
      line.monthlyAdjustments = { ...(line.monthlyAdjustments || {}) };
      const before = line.monthlyAdjustments[month] || 0;
      if (Math.round(amount)) line.monthlyAdjustments[month] = Math.round(amount); else delete line.monthlyAdjustments[month];
      const summary = `Forecast: "${line.name}" adjustment in ${month} ${before} → ${Math.round(amount)}`;
      const changeId = await applyChange(ctx, 'set_outflow_adjustment', summary, [forecastOp(profile)]);
      const rc = await runningCosts(data);
      return done(summary + '.', changeId, { ...(isLinkedLine(line) ? { base_amount: rc.total } : {}), note: FORECAST_NOTE });
    },
  },
];

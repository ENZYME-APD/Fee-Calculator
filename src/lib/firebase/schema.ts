export interface Company {
  id?: string;
  name: string;
  logoUrl?: string;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'lifetime';
  trialEndsAt?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currency?: string;
  areaUnit?: 'sqm' | 'sqft';
  tier?: 'basic' | 'pro';
  createdAt: number;
}

export interface User {
  uid: string;
  email: string;
  companyId: string;
  role: 'admin' | 'member' | 'viewer';
  displayName?: string;
}

export interface Invite {
  id?: string;
  email: string;
  companyId: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;
  createdAt: number;
}

export interface TeamCategory {
  id?: string;
  companyId: string;
  name: string;
  order: number;
  color?: string;
  isFixed?: boolean;
  type?: 'internal' | 'external';
}

export interface TeamMember {
  id?: string;
  companyId: string;
  name: string;
  position: string;
  type: string; // 'Employee' | 'Consultant'
  salary: number; // Monthly base cost
  overheads: number; // Monthly overheads
  costPerHour: number;
  currency: string;
  category?: string;
  nonBillablePercentage?: number;
  nonBillableDescription?: string;
  isOverheadsManuallyOverridden?: boolean;
  avatarUrl?: string;
  role?: string;
}

export interface Project {
  id?: string;
  companyId: string;
  name: string;
  description: string;
  createdAt: number;
  profitMargin?: number;
  fixedFee?: number | null; // when set (> 0) the total fee is fixed and the margin is calculated from it
  isTemplate?: boolean;
  area?: number;
  startDate?: number;
  status?: string; // 'Draft' | 'Active' | 'Completed' | 'Lost'
  ownerId?: string;
}

export interface Phase {
  id?: string;
  companyId: string;
  projectId: string;
  name: string;
  description: string;
  tasks?: string;
  inclusions?: string;
  omissions?: string;
  deliverables?: string;
  durationWeeks: number;
  order: number;
}

export interface Allocation {
  id?: string;
  companyId: string;
  projectId: string;
  phaseId: string;
  memberId: string;
  allocationType: 'hours' | 'percentage' | 'weeks';
  allocationValue: number;
  hours: number;
  // The member's costPerHour at the time this allocation was created/last
  // reassigned, so fee calculations stay correct if the member's salary
  // changes later. Older allocations predating this field fall back to the
  // member's current costPerHour (see getAllocationRate in
  // src/lib/utils/allocationCost.ts). An admin can re-pull current rates
  // for a whole project with the "Refresh Rates" action.
  costPerHourSnapshot?: number;
}

export interface ProjectCost {
  id?: string;
  companyId: string;
  projectId: string;
  phaseId: string;
  type: 'rendering' | 'trip' | 'consultant' | 'other';
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Payment {
  id?: string;
  companyId: string;
  projectId: string;
  phaseId?: string;
  name: string;
  percentage: number;
  amount?: number | null; // fixed amount; when set, the percentage is calculated from the fee
  order: number;
}

export interface DocumentBlock {
  id?: string;
  companyId: string;
  projectId?: string; // If null, it belongs to the company defaults
  type: 'rich_text' | 'phase_scope' | 'financial_summary' | 'payment_schedule' | 'team_breakdown';
  title: string;
  content: string; // HTML string for rich_text
  order: number;
}

export interface ProjectTask {
  id?: string;
  companyId: string;
  projectId: string;
  phaseId: string;
  memberId?: string; // If unassigned, it's null
  name: string;
  description: string;
  startDate: number; // timestamp
  durationHours: number;
  includeWeekends: boolean;
}


export interface SavedBlock {
  id?: string;
  companyId: string;
  templateName: string;
  type: DocumentBlock['type'];
  title: string;
  content: string;
}

export interface OverheadItem {
  id: string;
  name: string;
  yearlyCost: number;
  isActive: boolean;
}

export interface OverheadCategory {
  id: string;
  name: string;
  items: OverheadItem[];
}

export interface OverheadsProfile {
  id?: string;
  companyId: string;
  yearlyIncomeTarget: number;
  workingHoursPerYear: number;
  categories: OverheadCategory[];
  calculatedOverheadPerPerson?: number;
  updatedAt: number;
}

export type ForecastStage = 'possible' | 'invoicing' | 'collections';

export interface ForecastPill {
  id: string;
  amount: number;
  label: string;
  invoiceNumber?: string;
  notes?: string;
  referralName?: string;
  referralPercent?: number;
}

// Custom group (e.g. "India", "Spain") that collapses rows together in the forecast
export type ForecastGroupColor =
  | 'accent' | 'info' | 'positive' | 'warning' | 'clay' | 'negative' | 'ink'
  | 'sky' | 'navy' | 'cyan' | 'forest' | 'olive' | 'brown' | 'rose' | 'sand';
export interface ForecastGroup {
  id: string;
  name: string;
  color: ForecastGroupColor;
}

export interface ForecastRow {
  id: string;
  name: string;
  type: 'project' | 'external' | 'retainer';
  projectId?: string;
  groupId?: string;
  colorTag?: 'default' | 'accent' | 'negative' | 'warning' | 'positive'; // legacy, replaced by groups
  notes?: string;
  // monthKey format YYYY-MM -> stage -> pills array
  cells: Record<string, Partial<Record<ForecastStage, ForecastPill[]>>>;
}

// One expense in an outflow line for a month (several can share a month; they add up)
export interface ForecastOutflowPill {
  id: string;
  amount: number;
  description?: string;
}

export interface ForecastOutflowItem {
  id: string;
  name: string;
  type: 'burn' | 'partner' | 'debt' | 'custom';
  monthlyAmounts: Record<string, number>; // YYYY-MM -> amount (legacy; converted to monthlyPills on load)
  monthlyPills?: Record<string, ForecastOutflowPill[]>; // YYYY-MM -> expenses; override defaultMonthlyAmount for that month
  defaultMonthlyAmount?: number; // applies to every month without its own entry in monthlyAmounts
  initialBalance?: number; // for debt tracking
  linkedToOverheads?: boolean; // base amount = monthly salaries (Team resources) + active overhead items / 12 (Overheads)
  monthlyAdjustments?: Record<string, number>; // YYYY-MM -> +/- correction on top of the month's amount
  groupId?: string;
}

export interface ForecastProfile {
  id?: string;
  companyId: string;
  startingBankBalance: number;
  possibleConversionPercent: number; // default 50
  invoicingConversionPercent: number; // default 90
  startMonthKey: string; // YYYY-MM
  openingMonthKey?: string; // YYYY-MM: startingBankBalance is the cash at the start of this month
  visibleMonthsCount: number; // default 6
  rows: ForecastRow[];
  outflows: ForecastOutflowItem[];
  groups?: ForecastGroup[]; // shared by inflow and outflow lines
  updatedAt: number;
}


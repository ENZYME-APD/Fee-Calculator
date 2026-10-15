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
}

export interface ForecastRow {
  id: string;
  name: string;
  type: 'project' | 'external' | 'retainer';
  projectId?: string;
  colorTag?: 'default' | 'accent' | 'negative' | 'warning' | 'positive';
  notes?: string;
  // monthKey format YYYY-MM -> stage -> pills array
  cells: Record<string, Partial<Record<ForecastStage, ForecastPill[]>>>;
}

export interface ForecastOutflowItem {
  id: string;
  name: string;
  type: 'burn' | 'partner' | 'debt' | 'custom';
  monthlyAmounts: Record<string, number>; // YYYY-MM -> amount
  initialBalance?: number; // for debt tracking
}

export interface ForecastProfile {
  id?: string;
  companyId: string;
  startingBankBalance: number;
  possibleConversionPercent: number; // default 50
  invoicingConversionPercent: number; // default 90
  startMonthKey: string; // YYYY-MM
  visibleMonthsCount: number; // default 6
  rows: ForecastRow[];
  outflows: ForecastOutflowItem[];
  updatedAt: number;
}


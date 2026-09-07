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

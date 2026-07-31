export interface Company {
  id?: string;
  name: string;
  logoUrl?: string;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'lifetime';
  trialEndsAt?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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

export interface TeamMember {
  id?: string;
  companyId: string;
  name: string;
  position: string;
  type: string; // 'Employee' | 'Consultant'
  salary: number; // Monthly base cost
  overheads: number; // Monthly overheads
  costPerHour: number;
  roundedFeeHour: number;
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
  type: 'rendering' | 'trip' | 'consultant';
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

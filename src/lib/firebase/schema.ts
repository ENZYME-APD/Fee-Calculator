export interface TeamMember {
  id?: string;
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
  name: string;
  description: string;
  createdAt: number;
  profitMargin?: number;
}

export interface Phase {
  id?: string;
  projectId: string;
  name: string;
  description: string;
  durationWeeks: number;
  order: number;
}

export interface Allocation {
  id?: string;
  phaseId: string;
  memberId: string;
  allocationType: 'hours' | 'percentage' | 'weeks';
  allocationValue: number;
  hours: number;
}

export interface ProjectCost {
  id?: string;
  projectId: string;
  phaseId: string;
  type: 'rendering' | 'trip' | 'consultant';
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Payment {
  id?: string;
  projectId: string;
  phaseId?: string;
  name: string;
  percentage: number;
  order: number;
}

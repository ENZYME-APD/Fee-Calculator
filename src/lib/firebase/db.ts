import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData, writeBatch, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from './config';
import { TeamMember, Project, Phase, Allocation, ProjectCost, Payment, Invite, TeamCategory, User, ProjectTask, DocumentBlock , SavedBlock, OverheadsProfile, ForecastProfile } from './schema';

import { logActivity } from '@/lib/activity';

// What a document was called before it's deleted, for the change log
const beforeDelete = async (col: string, id: string): Promise<{ label?: string; refs?: { projectId?: string; phaseId?: string; memberId?: string } }> => {
  try {
    const snap = await getDoc(doc(db, col, id));
    const d = snap.data() as any;
    if (!d) return {};
    return { label: d.name || d.title || d.email || undefined, refs: { projectId: d.projectId, phaseId: d.phaseId, memberId: d.memberId } };
  } catch { return {}; }
};

const sanitize = (obj: any) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

const extractData = (docSnap: DocumentData) => ({ id: docSnap.id, ...docSnap.data() });

let currentCompanyId: string | null = null;
export const setDbCompanyId = (id: string | null) => {
  currentCompanyId = id;
};

const requireCompanyId = () => {
  if (!currentCompanyId) throw new Error("No companyId set. User must be authenticated.");
  return currentCompanyId;
};

// --- Companies ---
export const getCompany = async (id: string): Promise<any> => {
  const docRef = doc(db, 'companies', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return extractData(snap);
};

export const updateCompany = async (id: string, updates: any) => {
  const docRef = doc(db, 'companies', id);
  await updateDoc(docRef, sanitize(updates));
  logActivity({ action: 'update', area: 'companies', docId: id, changes: sanitize(updates) });
};

export const getAllCompaniesForSuperadmin = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, 'companies'));
  return snap.docs.map(extractData);
};

export const getAllUsersForSuperadmin = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(extractData) as User[];
};

// --- Invites ---
export const createInvite = async (invite: Omit<Invite, 'id'>) => {
  const docRef = await addDoc(collection(db, 'invites'), sanitize(invite));
  logActivity({ action: 'create', area: 'invites', docId: docRef.id, summary: `Invited ${invite.email} as ${invite.role}` });
  return docRef.id;
};

export const deleteInvite = async (id: string) => {
  const was = await beforeDelete('invites', id);
  await deleteDoc(doc(db, 'invites', id));
  logActivity({ action: 'delete', area: 'invites', docId: id, summary: `Cancelled the invite${was.label ? ` for ${was.label}` : ''}` });
};

export const getInvitesByCompany = async (): Promise<Invite[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'invites'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Invite[];
};

// --- Team Categories ---
export const getCategories = async (): Promise<TeamCategory[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'categories'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as TeamCategory[];
};

export const addCategory = async (category: Omit<TeamCategory, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'categories'), sanitize({ ...category, companyId: requireCompanyId() }));
  logActivity({ action: 'create', area: 'categories', docId: docRef.id, label: category.name });
  return docRef.id;
};

export const updateCategory = async (id: string, updates: Partial<Omit<TeamCategory, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'categories', id), sanitize(updates) as any);
  logActivity({ action: 'update', area: 'categories', docId: id, changes: sanitize(updates) });
};

export const deleteCategory = async (id: string) => {
  const was = await beforeDelete('categories', id);
  await deleteDoc(doc(db, 'categories', id));
  logActivity({ action: 'delete', area: 'categories', docId: id, label: was.label });
};

export const batchAddCategories = async (categories: Omit<TeamCategory, 'id' | 'companyId'>[]) => {
  const batch = writeBatch(db);
  const companyId = requireCompanyId();
  for (const cat of categories) {
    const newRef = doc(collection(db, 'categories'));
    batch.set(newRef, sanitize({ ...cat, companyId }));
  }
  await batch.commit();
  if (categories.length) logActivity({ action: 'create', area: 'categories', count: categories.length, summary: `Added ${categories.length} team categor${categories.length === 1 ? 'y' : 'ies'}` });
};

// --- Team Members ---
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'teamMembers'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as TeamMember[];
};

export const addTeamMember = async (member: Omit<TeamMember, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'teamMembers'), sanitize({ ...member, companyId: requireCompanyId() }));
  logActivity({ action: 'create', area: 'teamMembers', docId: docRef.id, label: member.name, changes: { position: member.position, salary: member.salary, overheads: member.overheads, costPerHour: member.costPerHour } });
  return docRef.id;
};

export const batchAddTeamMembers = async (members: Omit<TeamMember, 'id' | 'companyId'>[]) => {
  const batch = writeBatch(db);
  for (const member of members) {
    const newRef = doc(collection(db, 'teamMembers'));
    batch.set(newRef, sanitize({ ...member, companyId: requireCompanyId() }));
  }
  await batch.commit();
  if (members.length) logActivity({ action: 'create', area: 'teamMembers', count: members.length, summary: `Added ${members.length} team member${members.length === 1 ? '' : 's'} (${members.slice(0, 5).map(m => m.name).join(', ')}${members.length > 5 ? '…' : ''})` });
};

export const updateTeamMember = async (id: string, updates: Partial<Omit<TeamMember, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'teamMembers', id), sanitize(updates) as any);
  logActivity({ action: 'update', area: 'teamMembers', docId: id, changes: sanitize(updates) });
};

export const batchUpdateTeamMembers = async (updates: {id: string, data: Partial<TeamMember>}[]) => {
  const batch = writeBatch(db);
  for (const update of updates) {
    const docRef = doc(db, 'teamMembers', update.id);
    batch.update(docRef, update.data as DocumentData);
  }
  await batch.commit();
  updates.forEach(u => logActivity({ action: 'update', area: 'teamMembers', docId: u.id, changes: sanitize(u.data) }));
};

export const deleteTeamMember = async (id: string) => {
  const was = await beforeDelete('teamMembers', id);
  await deleteDoc(doc(db, 'teamMembers', id));
  logActivity({ action: 'delete', area: 'teamMembers', docId: id, label: was.label });
};

export const getTeamMember = async (id: string): Promise<TeamMember | null> => {
  const snap = await getDoc(doc(db, 'teamMembers', id));
  if (!snap.exists()) return null;
  return extractData(snap) as TeamMember;
};

// --- Projects ---
export const getProjects = async (isTemplate: boolean = false, ownerId?: string): Promise<Project[]> => {
  const companyId = requireCompanyId();
  let q = query(collection(db, 'projects'), where('companyId', '==', companyId));
  if (ownerId) {
    q = query(collection(db, 'projects'), where('companyId', '==', companyId), where('ownerId', '==', ownerId));
  }
  const snap = await getDocs(q);
  const allProjects = snap.docs.map(extractData) as Project[];
  return allProjects.filter(p => (!!p.isTemplate) === isTemplate);
};

export const addProject = async (project: Omit<Project, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'projects'), sanitize({
    ...project,
    companyId: requireCompanyId(),
    ownerId: project.ownerId || auth.currentUser?.uid,
    status: project.status || 'Draft',
    startDate: project.startDate || Date.now()
  }));
  logActivity({ action: 'create', area: 'projects', docId: docRef.id, label: project.name, summary: `Created ${project.isTemplate ? 'template' : 'project'} "${project.name}"` });
  return docRef.id;
};

export const updateProject = async (id: string, project: Partial<Omit<Project, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, sanitize(project) as any);
  logActivity({ action: 'update', area: 'projects', docId: id, changes: sanitize(project) });
};

export const deleteProject = async (id: string) => {
  const was = await beforeDelete('projects', id);
  await deleteDoc(doc(db, 'projects', id));
  logActivity({ action: 'delete', area: 'projects', docId: id, label: was.label, summary: `Deleted project "${was.label || id}"` });
};

export const duplicateProject = async (id: string, includeAllocations: boolean = true, newName?: string, isTemplate: boolean = false): Promise<string> => {
  // 1. Fetch source project
  const companyId = requireCompanyId();
  const projectSnap = await getDocs(query(collection(db, 'projects'), where('companyId', '==', companyId)));
  const project = projectSnap.docs.map(extractData).find((p: any) => p.id === id) as Project;
  if (!project) throw new Error("Project not found");

  // 2. Fetch all nested data
  const phases = await getPhases(id);
  const projectCosts = await getProjectCosts(id);
  const payments = await getPayments(id);
  
  const allocationsSnap = await getDocs(query(collection(db, 'allocations'), where('companyId', '==', companyId)));
  const allAllocations = allocationsSnap.docs.map(extractData) as Allocation[];
  
  const phaseIds = phases.map(p => p.id!);
  const projectAllocations = allAllocations.filter(a => phaseIds.includes(a.phaseId));

  // 3. Duplicate using writeBatch
  const batch = writeBatch(db);
  
  const newProjectRef = doc(collection(db, 'projects'));
  const newProjectId = newProjectRef.id;
  
  batch.set(newProjectRef, sanitize({
    name: newName || `${project.name} (Copy)`,
    description: project.description || '',
    profitMargin: project.profitMargin ?? 30, // keep a deliberate 0%
    fixedFee: isTemplate ? undefined : (project.fixedFee || undefined),
    companyId: requireCompanyId(),
    createdAt: Date.now(),
    isTemplate: isTemplate,
    ownerId: auth.currentUser?.uid,
    status: 'Draft'
  }));

  const phaseIdMap = new Map<string, string>();
  
  // 4. Duplicate phases
  for (const phase of phases) {
    const oldPhaseId = phase.id!;
    const newPhaseRef = doc(collection(db, 'phases'));
    phaseIdMap.set(oldPhaseId, newPhaseRef.id);
    
    const { id: _ignore, projectId: _ignore2, ...phaseData } = phase;
    batch.set(newPhaseRef, sanitize({ ...phaseData, projectId: newProjectId, companyId: companyId }));
  }

  // 5. Duplicate allocations (Optional)
  if (includeAllocations) {
    for (const alloc of projectAllocations) {
      const newPhaseId = phaseIdMap.get(alloc.phaseId);
      if (newPhaseId) {
        const newAllocRef = doc(collection(db, 'allocations'));
        const { id: _ignore, phaseId: _ignore2, projectId: _ignore3, ...allocData } = alloc as any;
        batch.set(newAllocRef, sanitize({ ...allocData, projectId: newProjectId, phaseId: newPhaseId, companyId: companyId }));
      }
    }

    // 6. Duplicate project costs (Optional)
    for (const cost of projectCosts) {
      const newPhaseId = phaseIdMap.get(cost.phaseId);
      if (newPhaseId) {
        const newCostRef = doc(collection(db, 'projectCosts'));
        const { id: _ignore, projectId: _ignore2, phaseId: _ignore3, ...costData } = cost;
        batch.set(newCostRef, sanitize({ ...costData, projectId: newProjectId, phaseId: newPhaseId, companyId: companyId }));
      }
    }
  }

  // 7. Duplicate payments
  for (const payment of payments) {
    const newPaymentRef = doc(collection(db, 'payments'));
    const { id: _ignore, projectId: _ignore2, phaseId, ...paymentData } = payment;
    let newPhaseId = payment.phaseId;
    if (payment.phaseId && phaseIdMap.has(payment.phaseId)) {
      newPhaseId = phaseIdMap.get(payment.phaseId);
    }
    
    batch.set(newPaymentRef, sanitize({ ...paymentData, projectId: newProjectId, phaseId: newPhaseId, companyId: companyId }));
  }

  await batch.commit();
  logActivity({ action: 'create', area: 'projects', docId: newProjectId, summary: `${isTemplate ? 'Saved' : 'Duplicated'} "${project.name}" as ${isTemplate ? 'template' : 'project'} "${newName || `${project.name} (Copy)`}"` });
  return newProjectId;
};

// --- Phases ---
export const getPhases = async (projectId?: string): Promise<Phase[]> => {
  const companyId = requireCompanyId();
  const q = projectId 
    ? query(collection(db, 'phases'), where('projectId', '==', projectId), where('companyId', '==', companyId))
    : query(collection(db, 'phases'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Phase[];
};

export const addPhase = async (phase: Omit<Phase, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'phases'), sanitize({ ...phase, companyId: requireCompanyId() }));
  logActivity({ action: 'create', area: 'phases', docId: docRef.id, label: phase.name, refs: { projectId: phase.projectId } });
  return docRef.id;
};

export const updatePhase = async (id: string, phase: Partial<Omit<Phase, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'phases', id);
  
  if (phase.durationWeeks !== undefined) {
    const batch = writeBatch(db);
    batch.update(docRef, sanitize(phase) as any);
    
    // Find all percentage-based allocations for this phase
    const allocSnap = await getDocs(query(collection(db, 'allocations'), where('phaseId', '==', id)));
    allocSnap.forEach(docSnap => {
      const alloc = docSnap.data();
      if (alloc.allocationType === 'percentage') {
        const newHours = (alloc.allocationValue / 100) * phase.durationWeeks! * 40;
        batch.update(docSnap.ref, { hours: newHours });
      }
    });
    
    await batch.commit();
  } else {
    await updateDoc(docRef, sanitize(phase) as any);
  }
  logActivity({ action: 'update', area: 'phases', docId: id, changes: sanitize(phase) });
};

export const deletePhase = async (id: string) => {
  const was = await beforeDelete('phases', id);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'phases', id));
  
  const allocSnap = await getDocs(query(collection(db, 'allocations'), where('phaseId', '==', id)));
  allocSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  const tasksSnap = await getDocs(query(collection(db, 'projectTasks'), where('phaseId', '==', id)));
  tasksSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  const costsSnap = await getDocs(query(collection(db, 'projectCosts'), where('phaseId', '==', id)));
  costsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  logActivity({ action: 'delete', area: 'phases', docId: id, label: was.label, refs: was.refs, summary: `Deleted phase "${was.label || id}" with its team hours, tasks and direct costs` });
};

export const clearPhase = async (phaseId: string) => {
  const was = await beforeDelete('phases', phaseId);
  const batch = writeBatch(db);
  
  // Delete all allocations for this phase
  const allocSnap = await getDocs(query(collection(db, 'allocations'), where('phaseId', '==', phaseId)));
  allocSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Delete all project costs for this phase
  const costsSnap = await getDocs(query(collection(db, 'projectCosts'), where('phaseId', '==', phaseId)));
  costsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Delete all payments for this phase
  const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('phaseId', '==', phaseId)));
  paymentsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  logActivity({ action: 'delete', area: 'phases', docId: phaseId, refs: was.refs, summary: `Cleared phase "${was.label || phaseId}": removed its team hours, direct costs and payments` });
};

// Project Costs
export const getProjectCosts = async (projectId?: string) => {
  const companyId = requireCompanyId();
  const q = projectId 
    ? query(collection(db, 'projectCosts'), where('projectId', '==', projectId), where('companyId', '==', companyId))
    : query(collection(db, 'projectCosts'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as ProjectCost[];
};

export const addProjectCost = async (cost: Omit<ProjectCost, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'projectCosts'), sanitize({ ...cost, companyId: requireCompanyId() }));
  logActivity({ action: 'create', area: 'projectCosts', docId: docRef.id, label: cost.name, refs: { projectId: cost.projectId }, changes: { quantity: cost.quantity, unitCost: cost.unitCost } });
  return docRef.id;
};

export const getUsersByCompany = async () => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'users'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
};

export const updateUser = async (uid: string, updates: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), sanitize(updates) as any);
  logActivity({ action: 'update', area: 'users', docId: uid, changes: sanitize(updates), summary: updates.role ? `Changed a user's role to ${updates.role}` : undefined });
};

export const removeUserFromCompany = async (uid: string) => {
  const was = await beforeDelete('users', uid);
  await deleteDoc(doc(db, 'users', uid));
  logActivity({ action: 'delete', area: 'users', docId: uid, summary: `Removed ${was.label || 'a user'} from the company` });
};


export const updateProjectCost = async (id: string, cost: Partial<Omit<ProjectCost, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'projectCosts', id), sanitize(cost) as any);
  logActivity({ action: 'update', area: 'projectCosts', docId: id, changes: sanitize(cost) });
};

export const deleteProjectCost = async (id: string) => {
  const was = await beforeDelete('projectCosts', id);
  await deleteDoc(doc(db, 'projectCosts', id));
  logActivity({ action: 'delete', area: 'projectCosts', docId: id, label: was.label, refs: was.refs });
};

export const importProjectData = async (data: any) => {
  const { project, phases, allocations, projectCosts, payments } = data;
  const batch = writeBatch(db);
  const companyId = requireCompanyId();
  
  // 1. Create new project
  const newProjectRef = doc(collection(db, 'projects'));
  const newProjectId = newProjectRef.id;
  batch.set(newProjectRef, sanitize({
    name: `${project.name} (Imported)`,
    description: project.description || '',
    createdAt: Date.now(),
    profitMargin: project.profitMargin ?? 30, // keep a deliberate 0%
    companyId
  }));

  // 2. Create phases and map old IDs to new IDs
  const phaseIdMap = new Map<string, string>();
  for (const phase of phases) {
    const oldId = phase.id;
    const newPhaseRef = doc(collection(db, 'phases'));
    phaseIdMap.set(oldId, newPhaseRef.id);
    batch.set(newPhaseRef, sanitize({
      projectId: newProjectId,
      name: phase.name,
      description: phase.description || '',
      durationWeeks: phase.durationWeeks || 1,
      order: phase.order || 1,
      companyId
    }));
  }

  // 3. Create allocations
  for (const alloc of allocations) {
    const { id, phaseId, projectId: oldPid, ...allocData } = alloc as any;
    const newPhaseId = phaseIdMap.get(phaseId);
    
    if (newPhaseId) {
      const newAllocRef = doc(collection(db, 'allocations'));
      batch.set(newAllocRef, sanitize({ ...allocData, projectId: newProjectId, phaseId: newPhaseId, companyId }));
    }
  }
  
  // 4. Create Project Costs
  if (projectCosts && Array.isArray(projectCosts)) {
    for (const cost of projectCosts) {
      const { id, projectId: oldPid, phaseId, ...costData } = cost;
      const newPhaseId = phaseIdMap.get(phaseId);
      if (newPhaseId) {
        const newCostRef = doc(collection(db, 'projectCosts'));
        batch.set(newCostRef, sanitize({ ...costData, projectId: newProjectId, phaseId: newPhaseId, companyId }));
      }
    }
  }

  // 5. Create Payments
  if (payments && Array.isArray(payments)) {
    for (const payment of payments) {
      const { id, projectId: oldPid, phaseId, ...paymentData } = payment;
      let newPhaseId = phaseId;
      if (phaseId && phaseIdMap.has(phaseId)) {
        newPhaseId = phaseIdMap.get(phaseId);
      }
      const newPaymentRef = doc(collection(db, 'payments'));
      batch.set(newPaymentRef, sanitize({ ...paymentData, projectId: newProjectId, phaseId: newPhaseId, companyId }));
    }
  }

  await batch.commit();
  logActivity({ action: 'create', area: 'projects', docId: newProjectId, summary: `Imported project "${project.name}"` });
  
  return newProjectId;
};

// --- Allocations ---
export const getAllocations = async (): Promise<Allocation[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'allocations'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Allocation[];
};

// Snapshots the member's current costPerHour onto the allocation so later
// salary changes don't retroactively change an already-agreed fee. See
// src/lib/utils/allocationCost.ts and the "Refresh Rates" action.
export const addAllocation = async (allocation: Omit<Allocation, 'id' | 'companyId'>) => {
  let costPerHourSnapshot = (allocation as Allocation).costPerHourSnapshot;
  if (costPerHourSnapshot === undefined && allocation.memberId) {
    const member = await getTeamMember(allocation.memberId);
    costPerHourSnapshot = member?.costPerHour;
  }
  const docRef = await addDoc(
    collection(db, 'allocations'),
    sanitize({ ...allocation, costPerHourSnapshot, companyId: requireCompanyId() })
  );
  logActivity({ action: 'create', area: 'allocations', docId: docRef.id, refs: { projectId: allocation.projectId, phaseId: allocation.phaseId, memberId: allocation.memberId }, changes: { hours: allocation.hours } });
  return docRef.id;
};

export const updateAllocation = async (id: string, allocation: Partial<Omit<Allocation, 'id' | 'companyId'>>) => {
  const updates: Partial<Allocation> = { ...allocation };
  // Reassigning to a different member re-snapshots their current rate,
  // unless the caller already supplied an explicit snapshot.
  if (allocation.memberId && updates.costPerHourSnapshot === undefined) {
    const member = await getTeamMember(allocation.memberId);
    updates.costPerHourSnapshot = member?.costPerHour;
  }
  await updateDoc(doc(db, 'allocations', id), sanitize(updates) as any);
  logActivity({ action: 'update', area: 'allocations', docId: id, changes: sanitize(updates) });
};

export const deleteAllocation = async (id: string) => {
  const was = await beforeDelete('allocations', id);
  await deleteDoc(doc(db, 'allocations', id));
  logActivity({ action: 'delete', area: 'allocations', docId: id, refs: was.refs });
};

// Admin action: re-pull every allocation's costPerHourSnapshot in a project
// from the team members' current rates. Use when salaries changed and a
// still-open proposal should reflect the new numbers.
export const refreshProjectAllocationRates = async (projectId: string): Promise<number> => {
  const companyId = requireCompanyId();
  const [allocSnap, membersSnap] = await Promise.all([
    getDocs(query(collection(db, 'allocations'), where('companyId', '==', companyId), where('projectId', '==', projectId))),
    getDocs(query(collection(db, 'teamMembers'), where('companyId', '==', companyId))),
  ]);
  const membersMap = new Map(membersSnap.docs.map(d => [d.id, d.data() as TeamMember]));

  const batch = writeBatch(db);
  let updated = 0;
  allocSnap.docs.forEach(docSnap => {
    const alloc = docSnap.data() as Allocation;
    const member = membersMap.get(alloc.memberId);
    if (member && member.costPerHour !== alloc.costPerHourSnapshot) {
      batch.update(docSnap.ref, { costPerHourSnapshot: member.costPerHour });
      updated++;
    }
  });
  if (updated > 0) {
    await batch.commit();
    logActivity({ action: 'update', area: 'allocations', count: updated, refs: { projectId }, summary: `Refreshed ${updated} agreed hourly rate${updated === 1 ? '' : 's'} to the team's current rates` });
  }
  return updated;
};

// --- Payments ---
export const getPayments = async (projectId: string): Promise<Payment[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'payments'), where('projectId', '==', projectId), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Payment[];
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'payments'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Payment[];
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'payments'), sanitize({ ...payment, companyId: requireCompanyId() }));
  logActivity({ action: 'create', area: 'payments', docId: docRef.id, label: payment.name, refs: { projectId: payment.projectId } });
  return docRef.id;
};

export const updatePayment = async (id: string, payment: Partial<Omit<Payment, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'payments', id), sanitize(payment) as any);
  logActivity({ action: 'update', area: 'payments', docId: id, changes: sanitize(payment) });
};

export const deletePayment = async (id: string) => {
  const was = await beforeDelete('payments', id);
  await deleteDoc(doc(db, 'payments', id));
  logActivity({ action: 'delete', area: 'payments', docId: id, label: was.label, refs: was.refs });
};

export const batchAddPayments = async (payments: Omit<Payment, 'id' | 'companyId'>[]) => {
  const batch = writeBatch(db);
  for (const payment of payments) {
    const newRef = doc(collection(db, 'payments'));
    batch.set(newRef, sanitize({ ...payment, companyId: requireCompanyId() }));
  }
  await batch.commit();
  if (payments.length) logActivity({ action: 'create', area: 'payments', count: payments.length, refs: { projectId: payments[0].projectId }, summary: `Added ${payments.length} payment milestone${payments.length === 1 ? '' : 's'}` });
};

export const batchUpdatePayments = async (updates: {id: string, data: Partial<Payment>}[]) => {
  const batch = writeBatch(db);
  for (const update of updates) {
    const docRef = doc(db, 'payments', update.id);
    batch.update(docRef, sanitize(update.data) as any);
  }
  await batch.commit();
  if (updates.length) logActivity({ action: 'update', area: 'payments', count: updates.length, docId: updates.length === 1 ? updates[0].id : undefined, summary: updates.length === 1 ? undefined : `Changed ${updates.length} payment milestones` });
};

export const clearPayments = async (projectId: string) => {
  const batch = writeBatch(db);
  const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('projectId', '==', projectId)));
  paymentsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  if (!paymentsSnap.empty) logActivity({ action: 'delete', area: 'payments', count: paymentsSnap.size, refs: { projectId }, summary: `Cleared the payment schedule (${paymentsSnap.size} milestone${paymentsSnap.size === 1 ? '' : 's'})` });
};

// --- Bootstrapping Sample Data ---
export const bootstrapCompanyData = async (companyId: string, ownerId: string) => {
  // Create sample categories. Must go in 'categories' (not 'teamCategories')
  // — that's the collection getCategories()/addCategory() actually read and
  // write everywhere else in the app (Settings, Team Resources, Fee
  // Proposal sidebar, Overheads). Writing to the wrong collection here meant
  // every new signup's sample team members pointed at a category id nothing
  // could resolve, so the UI fell back to printing the raw document id as
  // the category header.
  const catRef1 = await addDoc(collection(db, 'categories'), { companyId, name: 'Default team 1', order: 1, color: '#0F766E', isFixed: true, type: 'internal' });
  const catRef2 = await addDoc(collection(db, 'categories'), { companyId, name: 'Default Team External', order: 2, color: '#527A22', isFixed: true, type: 'external' });

  // Create sample team members
  const member1 = await addDoc(collection(db, 'teamMembers'), { companyId, name: 'Alice (Sample)', position: 'Partner', type: 'Employee', salary: 10000, overheads: 2000, costPerHour: 75, currency: 'USD', category: catRef1.id, isSample: true });
  const member2 = await addDoc(collection(db, 'teamMembers'), { companyId, name: 'Bob (Sample)', position: 'Senior Architect', type: 'Employee', salary: 7500, overheads: 1500, costPerHour: 56, currency: 'USD', category: catRef1.id, isSample: true });
  const member3 = await addDoc(collection(db, 'teamMembers'), { companyId, name: 'Charlie (Sample)', position: 'BIM Coordinator', type: 'Employee', salary: 6000, overheads: 1000, costPerHour: 43, currency: 'USD', category: catRef1.id, isSample: true });
  const member4 = await addDoc(collection(db, 'teamMembers'), { companyId, name: 'Diana (Sample)', position: 'Draftsperson', type: 'Consultant', salary: 4500, overheads: 800, costPerHour: 33, currency: 'USD', category: catRef2.id, isSample: true });

  // Create sample project
  const project = await addDoc(collection(db, 'projects'), { companyId, ownerId, name: 'Sample Office Fit-out', description: 'A sample project to get you started.', createdAt: Date.now(), profitMargin: 30, area: 1200, status: 'Draft', isSample: true });

  // Create sample phases
  const phase1 = await addDoc(collection(db, 'phases'), { companyId, projectId: project.id, name: 'Concept Design', description: 'Initial concept and feasibility', durationWeeks: 4, order: 1, isSample: true });
  const phase2 = await addDoc(collection(db, 'phases'), { companyId, projectId: project.id, name: 'Schematic Design', description: 'Developing the concept', durationWeeks: 6, order: 2, isSample: true });
  const phase3 = await addDoc(collection(db, 'phases'), { companyId, projectId: project.id, name: 'Detailed Design', description: 'Construction documentation', durationWeeks: 8, order: 3, isSample: true });

  // Create sample allocations
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase1.id, memberId: member1.id, allocationType: 'hours', allocationValue: 40, hours: 40, isSample: true });
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase1.id, memberId: member2.id, allocationType: 'hours', allocationValue: 80, hours: 80, isSample: true });
  
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase2.id, memberId: member2.id, allocationType: 'hours', allocationValue: 120, hours: 120, isSample: true });
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase2.id, memberId: member3.id, allocationType: 'hours', allocationValue: 160, hours: 160, isSample: true });
  
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase3.id, memberId: member2.id, allocationType: 'hours', allocationValue: 80, hours: 80, isSample: true });
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase3.id, memberId: member3.id, allocationType: 'hours', allocationValue: 120, hours: 120, isSample: true });
  await addDoc(collection(db, 'allocations'), { companyId, projectId: project.id, phaseId: phase3.id, memberId: member4.id, allocationType: 'hours', allocationValue: 240, hours: 240, isSample: true });
};

export const clearSampleData = async (companyId: string) => {
  const deleteSamples = async (collectionName: string) => {
    const q = query(collection(db, collectionName), where('companyId', '==', companyId), where('isSample', '==', true));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(docSnap => batch.delete(docSnap.ref));
    if (!snap.empty) {
      await batch.commit();
    }
  };

  await Promise.all([
    deleteSamples('projects'),
    deleteSamples('phases'),
    deleteSamples('teamMembers'),
    deleteSamples('allocations'),
    deleteSamples('projectCosts'),
    deleteSamples('payments'),
  ]);
  logActivity({ action: 'delete', area: 'sampleData', summary: 'Removed the sample data' });
};

export const deleteAccountData = async (companyId: string, uid: string) => {
  // Check how many users are in this company
  const usersQ = query(collection(db, 'users'), where('companyId', '==', companyId));
  const usersSnap = await getDocs(usersQ);
  
  // If this is the last user, delete the whole company
  if (usersSnap.size <= 1) {
    const deleteCompanyCollection = async (collectionName: string) => {
      const q = query(collection(db, collectionName), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => batch.delete(docSnap.ref));
      if (!snap.empty) {
        await batch.commit();
      }
    };

    await Promise.all([
      deleteCompanyCollection('projects'),
      deleteCompanyCollection('phases'),
      deleteCompanyCollection('teamMembers'),
      deleteCompanyCollection('allocations'),
      deleteCompanyCollection('projectCosts'),
      deleteCompanyCollection('payments'),
      deleteCompanyCollection('teamCategories'),
      deleteCompanyCollection('overheadsProfile'),
      deleteCompanyCollection('invites')
    ]);

    // Delete the company document itself
    await deleteDoc(doc(db, 'companies', companyId));
  }

  // Always delete the user document
  await deleteDoc(doc(db, 'users', uid));
};

// --- PROJECT TASKS ---
export const getProjectTasks = async (projectId: string): Promise<ProjectTask[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'projectTasks'), where('companyId', '==', companyId), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as ProjectTask[];
};

export const addProjectTask = async (task: Omit<ProjectTask, 'id' | 'companyId'>) => {
  const companyId = requireCompanyId();
  const docRef = await addDoc(collection(db, 'projectTasks'), { ...task, companyId });
  logActivity({ action: 'create', area: 'projectTasks', docId: docRef.id, label: task.name, refs: { projectId: task.projectId } });
  return docRef.id;
};

export const updateProjectTask = async (id: string, updates: Partial<ProjectTask>) => {
  requireCompanyId();
  const docRef = doc(db, 'projectTasks', id);
  await updateDoc(docRef, updates);
  logActivity({ action: 'update', area: 'projectTasks', docId: id, changes: updates as Record<string, unknown>, coalesce: true });
};

export const deleteProjectTask = async (id: string) => {
  requireCompanyId();
  const was = await beforeDelete('projectTasks', id);
  const docRef = doc(db, 'projectTasks', id);
  await deleteDoc(docRef);
  logActivity({ action: 'delete', area: 'projectTasks', docId: id, label: was.label, refs: was.refs });
};


// Document Blocks
export const getDocumentBlocks = async (companyId: string, projectId?: string): Promise<DocumentBlock[]> => {
  let q;
  if (projectId) {
    q = query(collection(db, 'documentBlocks'), where('companyId', '==', companyId), where('projectId', '==', projectId));
  } else {
    q = query(collection(db, 'documentBlocks'), where('companyId', '==', companyId));
  }
  const snapshot = await getDocs(q);
  const blocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentBlock));
  return blocks.sort((a, b) => a.order - b.order);
};

export const addDocumentBlock = async (block: Omit<DocumentBlock, 'id'>) => {
  const docRef = await addDoc(collection(db, 'documentBlocks'), block);
  logActivity({ action: 'create', area: 'documentBlocks', docId: docRef.id, refs: { projectId: block.projectId }, summary: `Added document block "${block.title}"`, coalesce: true });
  return docRef.id;
};

export const updateDocumentBlock = async (id: string, block: Partial<Omit<DocumentBlock, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'documentBlocks', id);
  await updateDoc(docRef, block);
  logActivity({ action: 'update', area: 'documentBlocks', docId: id, changes: block as Record<string, unknown>, fieldsOnly: true, coalesce: true });
};

export const deleteDocumentBlock = async (id: string) => {
  const was = await beforeDelete('documentBlocks', id);
  const docRef = doc(db, 'documentBlocks', id);
  await deleteDoc(docRef);
  logActivity({ action: 'delete', area: 'documentBlocks', docId: id, refs: was.refs, summary: `Deleted document block${was.label ? ` "${was.label}"` : ''}` });
};

export const initializeDefaultBlocks = async (companyId: string, projectId: string) => {
  const defaultBlocks: Omit<DocumentBlock, 'id'>[] = [
    { companyId, projectId, type: 'rich_text', title: 'Introduction', content: '<p>Welcome to the fee proposal.</p>', order: 0 },
    { companyId, projectId, type: 'phase_scope', title: 'Project Scope', content: '', order: 1 },
    { companyId, projectId, type: 'financial_summary', title: 'Financial Summary', content: '', order: 2 },
    { companyId, projectId, type: 'payment_schedule', title: 'Payment Schedule', content: '', order: 3 },
    { companyId, projectId, type: 'team_breakdown', title: 'Team Allocation', content: '', order: 4 },
    { companyId, projectId, type: 'rich_text', title: 'Terms & Conditions', content: '<p>Standard terms apply.</p>', order: 5 }
  ];
  
  const promises = defaultBlocks.map(block => addDocumentBlock(block));
  await Promise.all(promises);
};


// ==========================================
// SAVED BLOCKS (TEMPLATES)
// ==========================================

export const getSavedBlocks = async (companyId: string): Promise<SavedBlock[]> => {
  const q = query(collection(db, 'saved_blocks'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedBlock));
};

export const addSavedBlock = async (block: Omit<SavedBlock, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'saved_blocks'), block);
  logActivity({ action: 'create', area: 'saved_blocks', docId: docRef.id, summary: `Saved block "${block.title}" to the template "${block.templateName}"` });
  return docRef.id;
};

export const updateSavedBlock = async (id: string, updates: Partial<Omit<SavedBlock, 'id' | 'companyId'>>): Promise<void> => {
  await updateDoc(doc(db, 'saved_blocks', id), sanitize(updates) as any);
  logActivity({ action: 'update', area: 'saved_blocks', docId: id, fieldsOnly: true, changes: updates as Record<string, unknown>, summary: `Edited saved template${updates.templateName ? ` "${updates.templateName}"` : ''}` });
};

export const deleteSavedBlock = async (id: string): Promise<void> => {
  const was = await beforeDelete('saved_blocks', id);
  await deleteDoc(doc(db, 'saved_blocks', id));
  logActivity({ action: 'delete', area: 'saved_blocks', docId: id, summary: `Deleted saved block${was.label ? ` "${was.label}"` : ''}` });
};

// --- Overheads Profile ---
export const getOverheadsProfile = async (): Promise<OverheadsProfile | null> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'overheadsProfile'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return extractData(snap.docs[0]) as OverheadsProfile;
};

/** Thrown when the saved overheads were changed elsewhere (another admin, or an AI assistant) since this page loaded them. */
export class OverheadsConflictError extends Error {}

/** Saves the overheads. With expectedUpdatedAt, refuses if the stored copy changed since. Returns the updatedAt it wrote. */
export const updateOverheadsProfile = async (profile: Partial<OverheadsProfile>, expectedUpdatedAt?: number | null): Promise<number> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'overheadsProfile'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  const updatedAt = Date.now();
  if (snap.empty) {
    await addDoc(collection(db, 'overheadsProfile'), sanitize({
      ...profile,
      companyId,
      updatedAt
    }));
  } else {
    const stored = snap.docs[0].data().updatedAt ?? null;
    if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== null && stored !== expectedUpdatedAt) {
      throw new OverheadsConflictError('The overheads were changed elsewhere.');
    }
    await updateDoc(snap.docs[0].ref, sanitize({
      ...profile,
      updatedAt
    }) as any);
  }
  logActivity({ action: 'update', area: 'overheadsProfile', docId: snap.docs[0]?.id, summary: 'Edited the overheads calculator', changes: { yearlyIncomeTarget: profile.yearlyIncomeTarget, workingHoursPerYear: profile.workingHoursPerYear }, coalesce: true });
  return updatedAt;
};

// --- Forecast Profile ---
export const getForecastProfile = async (): Promise<ForecastProfile | null> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'forecastProfile'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return extractData(snap.docs[0]) as ForecastProfile;
};

/** Thrown when the saved forecast was changed elsewhere (another admin, or an AI assistant) since this page loaded it. */
export class ForecastConflictError extends Error {}

/**
 * Saves the forecast. With expectedUpdatedAt, refuses (ForecastConflictError) if the stored copy has
 * been changed since that version, so an open page never silently overwrites newer work.
 * Returns the updatedAt it wrote.
 */
export const updateForecastProfile = async (input: Partial<ForecastProfile>, expectedUpdatedAt?: number | null): Promise<number> => {
  const companyId = requireCompanyId();
  // Firestore rejects the whole write if any nested field is undefined (e.g. a pill with no
  // invoice number), so strip them at every level.
  const profile = JSON.parse(JSON.stringify(input)) as Partial<ForecastProfile>;
  const q = query(collection(db, 'forecastProfile'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  
  const updatedAt = Date.now();
  if (snap.empty) {
    await addDoc(collection(db, 'forecastProfile'), sanitize({
      ...profile,
      companyId,
      updatedAt
    }));
  } else {
    const stored = snap.docs[0].data().updatedAt ?? null;
    if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== null && stored !== expectedUpdatedAt) {
      throw new ForecastConflictError('The forecast was changed elsewhere.');
    }
    await updateDoc(snap.docs[0].ref, sanitize({
      ...profile,
      updatedAt
    }) as any);
  }
  logActivity({ action: 'update', area: 'forecastProfile', docId: snap.docs[0]?.id, summary: 'Edited the financial forecast', coalesce: true });
  return updatedAt;
};


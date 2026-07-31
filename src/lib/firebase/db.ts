import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData, writeBatch, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { db } from './config';
import { TeamMember, Project, Phase, Allocation, ProjectCost, Payment, Invite } from './schema';

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
};

// --- Invites ---
export const createInvite = async (invite: Omit<Invite, 'id'>) => {
  const docRef = await addDoc(collection(db, 'invites'), sanitize(invite));
  return docRef.id;
};

export const getInviteByToken = async (token: string): Promise<Invite | null> => {
  const q = query(collection(db, 'invites'), where('token', '==', token));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return extractData(snap.docs[0]) as Invite;
};

export const deleteInvite = async (id: string) => {
  await deleteDoc(doc(db, 'invites', id));
};

export const getInvitesByCompany = async (): Promise<Invite[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'invites'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Invite[];
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
  return docRef.id;
};

export const batchAddTeamMembers = async (members: Omit<TeamMember, 'id' | 'companyId'>[]) => {
  const batch = writeBatch(db);
  for (const member of members) {
    const newRef = doc(collection(db, 'teamMembers'));
    batch.set(newRef, sanitize({ ...member, companyId: requireCompanyId() }));
  }
  await batch.commit();
};

export const updateTeamMember = async (id: string, updates: Partial<Omit<TeamMember, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'teamMembers', id), sanitize(updates) as any);
};

export const batchUpdateTeamMembers = async (updates: {id: string, data: Partial<TeamMember>}[]) => {
  const batch = writeBatch(db);
  for (const update of updates) {
    const docRef = doc(db, 'teamMembers', update.id);
    batch.update(docRef, update.data as DocumentData);
  }
  await batch.commit();
};

export const deleteTeamMember = async (id: string) => {
  await deleteDoc(doc(db, 'teamMembers', id));
};

// --- Projects ---
export const getProjects = async (): Promise<Project[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'projects'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Project[];
};

export const addProject = async (project: Omit<Project, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'projects'), sanitize({ ...project, companyId: requireCompanyId() }));
  return docRef.id;
};

export const updateProject = async (id: string, project: Partial<Omit<Project, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, sanitize(project) as any);
};

export const deleteProject = async (id: string) => {
  await deleteDoc(doc(db, 'projects', id));
};

export const duplicateProject = async (id: string, includeAllocations: boolean = true): Promise<string> => {
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
    name: `${project.name} (Copy)`,
    description: project.description || '',
    profitMargin: project.profitMargin || 30,
    companyId: requireCompanyId(),
    createdAt: Date.now()
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
        const { id: _ignore, phaseId: _ignore2, ...allocData } = alloc;
        batch.set(newAllocRef, sanitize({ ...allocData, phaseId: newPhaseId, companyId: companyId }));
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
    let newPhaseId = phaseId;
    if (phaseId && phaseIdMap.has(phaseId)) {
      newPhaseId = phaseIdMap.get(phaseId);
    }
    batch.set(newPaymentRef, sanitize({ ...paymentData, projectId: newProjectId, phaseId: newPhaseId, companyId: companyId }));
  }

  await batch.commit();
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
  return docRef.id;
};

export const updatePhase = async (id: string, phase: Partial<Omit<Phase, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'phases', id);
  await updateDoc(docRef, sanitize(phase) as any);
};

export const deletePhase = async (id: string) => {
  await deleteDoc(doc(db, 'phases', id));
  await clearPhase(id); // Clean up related data when deleting
};

export const clearPhase = async (phaseId: string) => {
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
};

// Project Costs
export const getProjectCosts = async (projectId: string) => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'projectCosts'), where('projectId', '==', projectId), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as ProjectCost[];
};

export const addProjectCost = async (cost: Omit<ProjectCost, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'projectCosts'), sanitize({ ...cost, companyId: requireCompanyId() }));
  return docRef.id;
};

export const updateProjectCost = async (id: string, cost: Partial<Omit<ProjectCost, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'projectCosts', id), sanitize(cost) as any);
};

export const deleteProjectCost = async (id: string) => {
  await deleteDoc(doc(db, 'projectCosts', id));
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
    profitMargin: project.profitMargin || 30,
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
    const { id, phaseId, ...allocData } = alloc;
    const newPhaseId = phaseIdMap.get(phaseId);
    
    if (newPhaseId) {
      const newAllocRef = doc(collection(db, 'allocations'));
      batch.set(newAllocRef, sanitize({ ...allocData, phaseId: newPhaseId, companyId }));
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
  
  return newProjectId;
};

// --- Allocations ---
export const getAllocations = async (): Promise<Allocation[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'allocations'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Allocation[];
};

export const addAllocation = async (allocation: Omit<Allocation, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'allocations'), sanitize({ ...allocation, companyId: requireCompanyId() }));
  return docRef.id;
};

export const updateAllocation = async (id: string, allocation: Partial<Omit<Allocation, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'allocations', id), sanitize(allocation) as any);
};

export const deleteAllocation = async (id: string) => {
  await deleteDoc(doc(db, 'allocations', id));
};

// --- Payments ---
export const getPayments = async (projectId: string): Promise<Payment[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'payments'), where('projectId', '==', projectId), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Payment[];
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'payments'), sanitize({ ...payment, companyId: requireCompanyId() }));
  return docRef.id;
};

export const updatePayment = async (id: string, payment: Partial<Omit<Payment, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'payments', id), sanitize(payment) as any);
};

export const deletePayment = async (id: string) => {
  await deleteDoc(doc(db, 'payments', id));
};

export const batchAddPayments = async (payments: Omit<Payment, 'id' | 'companyId'>[]) => {
  const batch = writeBatch(db);
  for (const payment of payments) {
    const newRef = doc(collection(db, 'payments'));
    batch.set(newRef, sanitize({ ...payment, companyId: requireCompanyId() }));
  }
  await batch.commit();
};

export const batchUpdatePayments = async (updates: {id: string, data: Partial<Payment>}[]) => {
  const batch = writeBatch(db);
  for (const update of updates) {
    const docRef = doc(db, 'payments', update.id);
    batch.update(docRef, sanitize(update.data) as any);
  }
  await batch.commit();
};

export const clearPayments = async (projectId: string) => {
  const batch = writeBatch(db);
  const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('projectId', '==', projectId)));
  paymentsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

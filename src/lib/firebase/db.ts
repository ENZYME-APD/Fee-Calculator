import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData, writeBatch, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from './config';
import { TeamMember, Project, Phase, Allocation, ProjectCost, Payment, Invite, TeamCategory, User } from './schema';

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

// --- Team Categories ---
export const getCategories = async (): Promise<TeamCategory[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'categories'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as TeamCategory[];
};

export const addCategory = async (category: Omit<TeamCategory, 'id' | 'companyId'>) => {
  const docRef = await addDoc(collection(db, 'categories'), sanitize({ ...category, companyId: requireCompanyId() }));
  return docRef.id;
};

export const updateCategory = async (id: string, updates: Partial<Omit<TeamCategory, 'id' | 'companyId'>>) => {
  await updateDoc(doc(db, 'categories', id), sanitize(updates) as any);
};

export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(db, 'categories', id));
};

export const batchAddCategories = async (categories: Omit<TeamCategory, 'id' | 'companyId'>[]) => {
  const batch = writeBatch(db);
  const companyId = requireCompanyId();
  for (const cat of categories) {
    const newRef = doc(collection(db, 'categories'));
    batch.set(newRef, sanitize({ ...cat, companyId }));
  }
  await batch.commit();
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
  return docRef.id;
};

export const updateProject = async (id: string, project: Partial<Omit<Project, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, sanitize(project) as any);
};

export const deleteProject = async (id: string) => {
  await deleteDoc(doc(db, 'projects', id));
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
    profitMargin: project.profitMargin || 30,
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
};

export const removeUserFromCompany = async (uid: string) => {
  await deleteDoc(doc(db, 'users', uid));
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

export const getAllPayments = async (): Promise<Payment[]> => {
  const companyId = requireCompanyId();
  const q = query(collection(db, 'payments'), where('companyId', '==', companyId));
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

// --- Bootstrapping Sample Data ---
export const bootstrapCompanyData = async (companyId: string, ownerId: string) => {
  // Create sample categories
  const catRef1 = await addDoc(collection(db, 'teamCategories'), { companyId, name: 'Default team 1', order: 1, color: '#3b82f6', isFixed: true, type: 'internal' });
  const catRef2 = await addDoc(collection(db, 'teamCategories'), { companyId, name: 'Default Team External', order: 2, color: '#10b981', isFixed: true, type: 'external' });

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
      deleteCompanyCollection('invites')
    ]);

    // Delete the company document itself
    await deleteDoc(doc(db, 'companies', companyId));
  }

  // Always delete the user document
  await deleteDoc(doc(db, 'users', uid));
};

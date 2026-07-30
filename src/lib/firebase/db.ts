import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, DocumentData, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { TeamMember, Project, Phase, Allocation, ProjectCost, Payment } from './schema';

const extractData = (docSnap: DocumentData) => ({ id: docSnap.id, ...docSnap.data() });

// --- Team Members ---
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const q = query(collection(db, 'teamMembers'));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as TeamMember[];
};

export const addTeamMember = async (member: Omit<TeamMember, 'id'>) => {
  const docRef = await addDoc(collection(db, 'teamMembers'), member);
  return docRef.id;
};

export const batchAddTeamMembers = async (members: Omit<TeamMember, 'id'>[]) => {
  const batch = writeBatch(db);
  for (const member of members) {
    const docRef = doc(collection(db, 'teamMembers'));
    batch.set(docRef, member as DocumentData);
  }
  await batch.commit();
};

export const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
  await updateDoc(doc(db, 'teamMembers', id), updates);
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
  const q = query(collection(db, 'projects'));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Project[];
};

export const addProject = async (project: Omit<Project, 'id'>) => {
  const docRef = await addDoc(collection(db, 'projects'), project);
  return docRef.id;
};

export const updateProject = async (id: string, project: Partial<Project>) => {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, project as DocumentData);
};

export const deleteProject = async (id: string) => {
  await deleteDoc(doc(db, 'projects', id));
};

export const duplicateProject = async (id: string, includeAllocations: boolean = true): Promise<string> => {
  // 1. Fetch source project
  const projectSnap = await getDocs(query(collection(db, 'projects')));
  const project = projectSnap.docs.map(extractData).find((p: any) => p.id === id) as Project;
  if (!project) throw new Error("Project not found");

  // 2. Fetch all nested data
  const phases = await getPhases(id);
  const projectCosts = await getProjectCosts(id);
  const payments = await getPayments(id);
  
  const allocationsSnap = await getDocs(query(collection(db, 'allocations')));
  const allAllocations = allocationsSnap.docs.map(extractData) as Allocation[];
  
  const phaseIds = phases.map(p => p.id!);
  const projectAllocations = allAllocations.filter(a => phaseIds.includes(a.phaseId));

  // 3. Duplicate using writeBatch
  const batch = writeBatch(db);
  
  const newProjectRef = doc(collection(db, 'projects'));
  const newProjectId = newProjectRef.id;
  
  batch.set(newProjectRef, {
    name: `${project.name} (Copy)`,
    description: project.description || '',
    profitMargin: project.profitMargin || 30,
    createdAt: Date.now()
  });

  const phaseIdMap = new Map<string, string>();
  
  // 4. Duplicate phases
  for (const phase of phases) {
    const oldPhaseId = phase.id!;
    const newPhaseRef = doc(collection(db, 'phases'));
    phaseIdMap.set(oldPhaseId, newPhaseRef.id);
    
    const { id: _ignore, projectId: _ignore2, ...phaseData } = phase;
    batch.set(newPhaseRef, { ...phaseData, projectId: newProjectId });
  }

  // 5. Duplicate allocations (Optional)
  if (includeAllocations) {
    for (const alloc of projectAllocations) {
      const newPhaseId = phaseIdMap.get(alloc.phaseId);
      if (newPhaseId) {
        const newAllocRef = doc(collection(db, 'allocations'));
        const { id: _ignore, phaseId: _ignore2, ...allocData } = alloc;
        batch.set(newAllocRef, { ...allocData, phaseId: newPhaseId });
      }
    }

    // 6. Duplicate project costs (Optional)
    for (const cost of projectCosts) {
      const newPhaseId = phaseIdMap.get(cost.phaseId);
      if (newPhaseId) {
        const newCostRef = doc(collection(db, 'projectCosts'));
        const { id: _ignore, projectId: _ignore2, phaseId: _ignore3, ...costData } = cost;
        batch.set(newCostRef, { ...costData, projectId: newProjectId, phaseId: newPhaseId });
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
    batch.set(newPaymentRef, { ...paymentData, projectId: newProjectId, phaseId: newPhaseId });
  }

  await batch.commit();
  return newProjectId;
};

// --- Phases ---
export const getPhases = async (projectId?: string): Promise<Phase[]> => {
  const q = projectId 
    ? query(collection(db, 'phases'), where('projectId', '==', projectId))
    : query(collection(db, 'phases'));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Phase[];
};

export const addPhase = async (phase: Omit<Phase, 'id'>) => {
  const docRef = await addDoc(collection(db, 'phases'), phase);
  return docRef.id;
};

export const updatePhase = async (id: string, phase: Partial<Phase>) => {
  const docRef = doc(db, 'phases', id);
  await updateDoc(docRef, phase as DocumentData);
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
  const q = query(collection(db, 'projectCosts'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectCost));
};

export const addProjectCost = async (cost: Omit<ProjectCost, 'id'>) => {
  const docRef = await addDoc(collection(db, 'projectCosts'), cost);
  return docRef.id;
};

export const updateProjectCost = async (id: string, updates: Partial<ProjectCost>) => {
  await updateDoc(doc(db, 'projectCosts', id), updates);
};

export const deleteProjectCost = async (id: string) => {
  await deleteDoc(doc(db, 'projectCosts', id));
};

export const importProjectData = async (data: any) => {
  const { project, phases, allocations, projectCosts, payments } = data;
  const batch = writeBatch(db);
  
  // 1. Create new project
  const newProjectRef = doc(collection(db, 'projects'));
  const newProjectId = newProjectRef.id;
  batch.set(newProjectRef, {
    name: `${project.name} (Imported)`,
    description: project.description || '',
    createdAt: Date.now(),
    profitMargin: project.profitMargin || 30
  });

  // 2. Create phases and map old IDs to new IDs
  const phaseIdMap = new Map<string, string>();
  for (const phase of phases) {
    const oldId = phase.id;
    const newPhaseRef = doc(collection(db, 'phases'));
    phaseIdMap.set(oldId, newPhaseRef.id);
    batch.set(newPhaseRef, {
      projectId: newProjectId,
      name: phase.name,
      description: phase.description || '',
      durationWeeks: phase.durationWeeks || 1,
      order: phase.order || 1
    });
  }

  // 3. Create allocations
  for (const alloc of allocations) {
    const oldId = alloc.id;
    const { id, phaseId, ...allocData } = alloc;
    const newPhaseId = phaseIdMap.get(phaseId);
    
    if (newPhaseId) {
      const newAllocRef = doc(collection(db, 'allocations'));
      batch.set(newAllocRef, { ...allocData, phaseId: newPhaseId });
    }
  }
  
  // 4. Create Project Costs
  if (projectCosts && Array.isArray(projectCosts)) {
    for (const cost of projectCosts) {
      const { id, projectId: oldPid, phaseId, ...costData } = cost;
      const newPhaseId = phaseIdMap.get(phaseId);
      if (newPhaseId) {
        const newCostRef = doc(collection(db, 'projectCosts'));
        batch.set(newCostRef, { ...costData, projectId: newProjectId, phaseId: newPhaseId });
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
      batch.set(newPaymentRef, { ...paymentData, projectId: newProjectId, phaseId: newPhaseId });
    }
  }

  await batch.commit();
  
  return newProjectId;
};

// --- Allocations ---
export const getAllocations = async (): Promise<Allocation[]> => {
  const q = query(collection(db, 'allocations'));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Allocation[];
};

export const addAllocation = async (allocation: Omit<Allocation, 'id'>) => {
  const docRef = await addDoc(collection(db, 'allocations'), allocation);
  return docRef.id;
};

export const updateAllocation = async (id: string, updates: Partial<Allocation>) => {
  await updateDoc(doc(db, 'allocations', id), updates);
};

export const deleteAllocation = async (id: string) => {
  await deleteDoc(doc(db, 'allocations', id));
};

// --- Payments ---
export const getPayments = async (projectId: string): Promise<Payment[]> => {
  const q = query(collection(db, 'payments'), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map(extractData) as Payment[];
};

export const addPayment = async (payment: Omit<Payment, 'id'>) => {
  const docRef = await addDoc(collection(db, 'payments'), payment);
  return docRef.id;
};

export const updatePayment = async (id: string, updates: Partial<Payment>) => {
  await updateDoc(doc(db, 'payments', id), updates);
};

export const deletePayment = async (id: string) => {
  await deleteDoc(doc(db, 'payments', id));
};

export const batchAddPayments = async (payments: Omit<Payment, 'id'>[]) => {
  const batch = writeBatch(db);
  for (const payment of payments) {
    const newRef = doc(collection(db, 'payments'));
    batch.set(newRef, payment);
  }
  await batch.commit();
};

export const batchUpdatePayments = async (updates: {id: string, data: Partial<Payment>}[]) => {
  const batch = writeBatch(db);
  for (const update of updates) {
    const docRef = doc(db, 'payments', update.id);
    batch.update(docRef, update.data);
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

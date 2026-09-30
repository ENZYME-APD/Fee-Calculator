const fs = require('fs');
const file = 'src/lib/firebase/db.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `export const updatePhase = async (id: string, phase: Partial<Omit<Phase, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'phases', id);
  await updateDoc(docRef, sanitize(phase) as any);
};`;

const replacement = `export const updatePhase = async (id: string, phase: Partial<Omit<Phase, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'phases', id);
  
  if (phase.durationWeeks !== undefined) {
    const batch = writeBatch(db);
    batch.update(docRef, sanitize(phase) as any);
    
    // Find all percentage-based allocations for this phase
    const allocSnap = await getDocs(query(collection(db, 'allocations'), where('phaseId', '==', id)));
    allocSnap.forEach(docSnap => {
      const alloc = docSnap.data();
      if (alloc.allocationType === 'percentage') {
        const newHours = (alloc.allocationValue / 100) * phase.durationWeeks * 40;
        batch.update(docSnap.ref, { hours: newHours });
      }
    });
    
    await batch.commit();
  } else {
    await updateDoc(docRef, sanitize(phase) as any);
  }
};`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);

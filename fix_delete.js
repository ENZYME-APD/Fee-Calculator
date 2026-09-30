const fs = require('fs');
const file = 'src/lib/firebase/db.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `export const deletePhase = async (id: string) => {
  await deleteDoc(doc(db, 'phases', id));
  await clearPhase(id); // Clean up related data when deleting
};`;

const replacement = `export const deletePhase = async (id: string) => {
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
};`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Success");
} else {
  console.log("Target not found");
}


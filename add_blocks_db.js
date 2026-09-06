const fs = require('fs');
const file = 'src/lib/firebase/db.ts';
let code = fs.readFileSync(file, 'utf8');

const newFunctions = `

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
  return docRef.id;
};

export const updateDocumentBlock = async (id: string, block: Partial<Omit<DocumentBlock, 'id' | 'companyId'>>) => {
  const docRef = doc(db, 'documentBlocks', id);
  await updateDoc(docRef, block);
};

export const deleteDocumentBlock = async (id: string) => {
  const docRef = doc(db, 'documentBlocks', id);
  await deleteDoc(docRef);
};

export const initializeDefaultBlocks = async (companyId: string, projectId: string) => {
  const defaultBlocks: Omit<DocumentBlock, 'id'>[] = [
    { companyId, projectId, type: 'rich_text', title: 'Introduction', content: '<p>Welcome to the fee proposal.</p>', order: 0 },
    { companyId, projectId, type: 'phase_scope', title: 'Project Scope', content: '', order: 1 },
    { companyId, projectId, type: 'financial_summary', title: 'Financial Summary', content: '', order: 2 },
    { companyId, projectId, type: 'team_breakdown', title: 'Team Allocation', content: '', order: 3 },
    { companyId, projectId, type: 'rich_text', title: 'Terms & Conditions', content: '<p>Standard terms apply.</p>', order: 4 }
  ];
  
  const promises = defaultBlocks.map(block => addDocumentBlock(block));
  await Promise.all(promises);
};
`;

code = code + newFunctions;
fs.writeFileSync(file, code);

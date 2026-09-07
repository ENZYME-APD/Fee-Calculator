const fs = require('fs');

// 1. Update schema.ts
const schemaFile = 'src/lib/firebase/schema.ts';
let schemaCode = fs.readFileSync(schemaFile, 'utf8');

const savedBlockInterface = `
export interface SavedBlock {
  id?: string;
  companyId: string;
  templateName: string;
  type: DocumentBlock['type'];
  title: string;
  content: string;
}
`;

if (!schemaCode.includes('export interface SavedBlock')) {
  schemaCode += '\n' + savedBlockInterface;
  fs.writeFileSync(schemaFile, schemaCode);
}

// 2. Update db.ts
const dbFile = 'src/lib/firebase/db.ts';
let dbCode = fs.readFileSync(dbFile, 'utf8');

const importRegex = /import \{[\s\S]*?\} from '\.\/schema';/;
const importMatch = dbCode.match(importRegex);
if (importMatch && !importMatch[0].includes('SavedBlock')) {
  dbCode = dbCode.replace(importMatch[0], importMatch[0].replace('}', ', SavedBlock }'));
}

const dbFunctions = `
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
  return docRef.id;
};

export const deleteSavedBlock = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'saved_blocks', id));
};
`;

if (!dbCode.includes('export const getSavedBlocks')) {
  dbCode += '\n' + dbFunctions;
  fs.writeFileSync(dbFile, dbCode);
}


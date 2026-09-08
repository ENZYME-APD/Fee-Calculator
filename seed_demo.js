const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config({ path: '.env.local' });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();

async function clearOldData(companyId) {
    const collections = ['projects', 'phases', 'project_costs', 'project_tasks', 'team_members', 'team_categories', 'allocations', 'payments', 'document_blocks', 'saved_blocks'];
    for (const col of collections) {
        const snapshot = await db.collection(col).where('companyId', '==', companyId).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
}

async function seed() {
  const email = 'demo@enzymead.com';
  
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log("Found user:", userRecord.uid);
    await auth.updateUser(userRecord.uid, { password: 'DemoPassword123!' });
    console.log("Reset password for user to DemoPassword123!");
  } catch (e) {
    console.log("User not found by email, creating...");
    userRecord = await auth.createUser({ email: email, password: 'DemoPassword123!', displayName: 'Demo Admin' });
  }

  let companyId;
  const companies = await db.collection('companies').get();
  companies.forEach(doc => {
    if (doc.data().name === 'Sample Demo Studio') companyId = doc.id;
  });

  if (!companyId) {
    console.log("Company 'Sample Demo Studio' not found, creating...");
    const compRef = await db.collection('companies').add({ name: 'Sample Demo Studio', subscriptionStatus: 'active', tier: 'pro', createdAt: Date.now(), currency: 'USD', areaUnit: 'sqm' });
    companyId = compRef.id;
  } else {
    await db.collection('companies').doc(companyId).update({ tier: 'pro', subscriptionStatus: 'active' });
  }
  await db.collection('users').doc(userRecord.uid).set({ email: email, companyId: companyId, role: 'owner', createdAt: Date.now() }, { merge: true });

  console.log("Clearing old demo data...");
  await clearOldData(companyId);

  console.log("Seeding new demo data...");
  
  // 1. Categories (Departments/Offices)
  const cats = [
    { name: 'Architecture Dept.', color: '#3b82f6', order: 1 },
    { name: 'Interior Design', color: '#10b981', order: 2 },
    { name: 'BIM Management', color: '#8b5cf6', order: 3 }
  ];
  const catDocs = await Promise.all(cats.map(c => db.collection('team_categories').add({ ...c, companyId, type: 'internal' })));
  
  // 2. Team Members (12 pax)
  const members = [
    { name: 'Sarah Jenkins', role: 'Design Director', hourlyRate: 150, categoryId: catDocs[0].id },
    { name: 'Michael Chen', role: 'Senior Architect', hourlyRate: 120, categoryId: catDocs[0].id },
    { name: 'David Rossi', role: 'Architect', hourlyRate: 95, categoryId: catDocs[0].id },
    { name: 'Emma Watson', role: 'Junior Architect', hourlyRate: 75, categoryId: catDocs[0].id },
    { name: 'Lisa Kudrow', role: 'Interior Director', hourlyRate: 140, categoryId: catDocs[1].id },
    { name: 'James Halpert', role: 'Senior Interior Designer', hourlyRate: 110, categoryId: catDocs[1].id },
    { name: 'Pam Beesly', role: 'Interior Designer', hourlyRate: 90, categoryId: catDocs[1].id },
    { name: 'Ryan Howard', role: 'Junior Interior Designer', hourlyRate: 70, categoryId: catDocs[1].id },
    { name: 'Dwight Schrute', role: 'BIM Manager', hourlyRate: 130, categoryId: catDocs[2].id },
    { name: 'Angela Martin', role: 'BIM Coordinator', hourlyRate: 100, categoryId: catDocs[2].id },
    { name: 'Kevin Malone', role: 'BIM Modeler', hourlyRate: 80, categoryId: catDocs[2].id },
    { name: 'Oscar Martinez', role: 'BIM Modeler', hourlyRate: 80, categoryId: catDocs[2].id }
  ];
  const memberDocs = await Promise.all(members.map(m => db.collection('team_members').add({ ...m, companyId, order: 0 })));

  // 3. Projects
  const projects = [
    { name: 'Oasis Wellness Center', status: 'Active', margin: 20 },
    { name: 'Vertex Corporate HQ', status: 'Proposed', margin: 25 },
    { name: 'Luminary Residential Tower', status: 'Active', margin: 15 },
    { name: 'Harbor Retail Complex', status: 'Draft', margin: 20 },
    { name: 'Nexus Tech Campus', status: 'Lost', margin: 18 }
  ];
  
  for (let i = 0; i < projects.length; i++) {
    const projRef = await db.collection('projects').add({ 
      ...projects[i], 
      companyId, 
      createdAt: Date.now() - (i * 86400000), 
      isTemplate: false 
    });
    const pId = projRef.id;

    // Phases
    const phases = ['Concept Design', 'Schematic Design', 'Detailed Design', 'Construction Docs'];
    const phaseRefs = await Promise.all(phases.map((name, idx) => 
      db.collection('phases').add({ companyId, projectId: pId, name, order: idx, multiplier: 1 })
    ));

    // Allocations (Randomish)
    for (const phaseRef of phaseRefs) {
      for (let j = 0; j < 4; j++) {
        const m = memberDocs[Math.floor(Math.random() * memberDocs.length)];
        await db.collection('allocations').add({
          companyId, projectId: pId, phaseId: phaseRef.id, memberId: m.id,
          hours: Math.floor(Math.random() * 80) + 20,
          allocationType: 'hours', allocationValue: 0
        });
      }
    }
    
    // Payment Milestones
    await db.collection('payments').add({ companyId, projectId: pId, title: 'Initial Deposit', percentage: 10, order: 0 });
    await db.collection('payments').add({ companyId, projectId: pId, title: 'Concept Approval', percentage: 20, order: 1 });
    await db.collection('payments').add({ companyId, projectId: pId, title: 'Schematic Design', percentage: 30, order: 2 });
    await db.collection('payments').add({ companyId, projectId: pId, title: 'Detailed Design', percentage: 40, order: 3 });

    // Document Blocks for proposals
    await db.collection('document_blocks').add({
      companyId, projectId: pId, type: 'rich_text', order: 0, title: 'Project Introduction',
      content: `<p>We are thrilled to present our proposal for ${projects[i].name}. This document outlines our understanding of the scope, our proposed team structure, and the financial summary of our architectural services.</p>`
    });
    await db.collection('document_blocks').add({ companyId, projectId: pId, type: 'financial_summary', order: 1, title: 'Financial Summary' });
    await db.collection('document_blocks').add({ companyId, projectId: pId, type: 'team_breakdown', order: 2, title: 'Team Structure' });
    await db.collection('document_blocks').add({ companyId, projectId: pId, type: 'payment_schedule', order: 3, title: 'Payment Milestones' });
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function seedDemo() {
  const email = 'demo@enzymead.com';
  const password = 'password123';
  let uid;

  try {
    const user = await auth.getUserByEmail(email);
    uid = user.uid;
    console.log('Demo user already exists, UID:', uid);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email,
        password,
        displayName: 'Demo User',
      });
      uid = newUser.uid;
      console.log('Created new demo user, UID:', uid);
    } else {
      throw error;
    }
  }

  // Create Company
  const companyRef = db.collection('companies').doc(uid); // Use uid as company id for simplicity
  await companyRef.set({
    name: 'Sample Demo Studio',
    subscriptionStatus: 'active',
    createdAt: Date.now()
  });

  await db.collection('users').doc(uid).set({
    email,
    companyId: uid,
    role: 'owner',
    createdAt: Date.now()
  });

  console.log('Company and User profiles set up.');

  // Clear existing demo data
  console.log('Clearing old demo data...');
  const collectionsToClear = ['teamMembers', 'projects', 'phases', 'allocations', 'projectCosts'];
  for (const col of collectionsToClear) {
    const snap = await db.collection(col).where('companyId', '==', uid).get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log('Seeding new data...');

  // 1. Team Members
  const teamData = [
    { name: 'Alice Smith', position: 'Director', category: 'Management', type: 'Employee', salary: 10000, overheads: 2000, costPerHour: 120, roundedFeeHour: 250, currency: 'USD' },
    { name: 'Bob Jones', position: 'Senior Architect', category: 'Team Global', type: 'Employee', salary: 6000, overheads: 1000, costPerHour: 60, roundedFeeHour: 150, currency: 'USD' },
    { name: 'Charlie Davis', position: 'Architect', category: 'Team Jakarta', type: 'Employee', salary: 3000, overheads: 500, costPerHour: 30, roundedFeeHour: 100, currency: 'USD' },
    { name: 'Diana Prince', position: 'MEP Consultant', category: 'Consultant', type: 'Consultant', salary: 0, overheads: 0, costPerHour: 90, roundedFeeHour: 180, currency: 'USD' },
  ];

  const memberIds = [];
  for (const t of teamData) {
    const docRef = db.collection('teamMembers').doc();
    await docRef.set({ ...t, companyId: uid, createdAt: Date.now() });
    memberIds.push({ id: docRef.id, ...t });
  }

  // 2. Projects
  const projectsData = [
    { name: 'Lakeside Residence', description: 'Luxury residential project', clientName: 'Johnson Family', area: 450, status: 'active', profitMargin: 20, isTemplate: false },
    { name: 'Downtown Commercial', description: 'Office building renovation', clientName: 'Apex Corp', area: 1200, status: 'active', profitMargin: 25, isTemplate: false }
  ];

  for (const p of projectsData) {
    const projRef = db.collection('projects').doc();
    await projRef.set({ ...p, companyId: uid, createdAt: Date.now() });
    
    // Phases for project
    const phasesData = [
      { name: 'Concept Design', description: 'Initial concept', order: 0, durationWeeks: 4 },
      { name: 'Schematic Design', description: 'Design development', order: 1, durationWeeks: 6 },
      { name: 'Detailed Design', description: 'Technical drawings', order: 2, durationWeeks: 8 },
    ];

    const phaseIds = [];
    for (const ph of phasesData) {
      const phRef = db.collection('phases').doc();
      await phRef.set({ ...ph, projectId: projRef.id, companyId: uid });
      phaseIds.push(phRef.id);
    }

    // Add some allocations
    // Phase 0: Alice (Management) 20h, Bob 40h
    await db.collection('allocations').add({ projectId: projRef.id, phaseId: phaseIds[0], companyId: uid, memberId: memberIds[0].id, hours: 20, allocationType: 'hours', allocationValue: 20 });
    await db.collection('allocations').add({ projectId: projRef.id, phaseId: phaseIds[0], companyId: uid, memberId: memberIds[1].id, hours: 40, allocationType: 'hours', allocationValue: 40 });
    
    // Phase 1: Bob 80h, Charlie 60h, Diana 10h
    await db.collection('allocations').add({ projectId: projRef.id, phaseId: phaseIds[1], companyId: uid, memberId: memberIds[1].id, hours: 80, allocationType: 'hours', allocationValue: 80 });
    await db.collection('allocations').add({ projectId: projRef.id, phaseId: phaseIds[1], companyId: uid, memberId: memberIds[2].id, hours: 60, allocationType: 'hours', allocationValue: 60 });
    await db.collection('allocations').add({ projectId: projRef.id, phaseId: phaseIds[1], companyId: uid, memberId: memberIds[3].id, hours: 10, allocationType: 'hours', allocationValue: 10 });

    // Costs
    await db.collection('projectCosts').add({ projectId: projRef.id, phaseId: phaseIds[0], companyId: uid, name: 'Site Visit Flights', type: 'trip', quantity: 2, unitCost: 450 });
    await db.collection('projectCosts').add({ projectId: projRef.id, phaseId: phaseIds[2], companyId: uid, name: '3D Renderings', type: 'rendering', quantity: 4, unitCost: 350 });
  }

  console.log('Successfully seeded database with demo data!');
  console.log('Login credentials:');
  console.log('Email: demo@enzymead.com');
  console.log('Password: password123');
  process.exit(0);
}

seedDemo().catch(console.error);

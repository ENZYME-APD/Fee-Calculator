/*
 * Creates a permanent demo company for screenshots, videos and demos, seeded
 * from a real company with every identifying detail replaced:
 *
 *   - the whole team (names replaced; positions kept; salaries, overheads and
 *     cost rates shifted by ±10–20%)
 *   - team categories (location-specific names replaced)
 *   - the 5 richest non-Lost projects that have team allocations, with their phases, allocations,
 *     costs, payment schedule, planning tasks and document blocks
 *     (project/phase/cost/payment/task names and all free text replaced;
 *     fees and costs shifted by ±10–20%)
 *   - the public-standard phase templates (RIBA, RAIC, CSCAE, China), copied as-is
 *   - the overheads profile (amounts shifted; item names replaced, except software)
 *   - an admin login for the demo company
 *
 * Nothing is written to the source company. Random shifts are seeded, so a
 * re-run on the same data produces the same numbers.
 *
 * Usage (from the repo root, with the production service account in .env.local):
 *   Dry run (prints the plan, writes nothing):
 *     node --env-file=.env.local scripts/create-demo-account.js
 *   Create the account:
 *     node --env-file=.env.local scripts/create-demo-account.js --write
 *
 * Options:
 *   --source=<email>      a user in the company to copy from (default j.beneitez@weareenzyme.com)
 *   --demo=<email>        login for the demo account       (default it@weareenzyme.com)
 *   --company=<name>      demo company name                (default "Halden Ruiz Architects")
 *   --projects=<n>        how many projects to copy        (default 5)
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  })
);
const WRITE = !!args.write;
const SOURCE_EMAIL = (args.source || 'j.beneitez@weareenzyme.com').toLowerCase();
const DEMO_EMAIL = (args.demo || 'it@weareenzyme.com').toLowerCase();
const DEMO_COMPANY = args.company || 'Halden Ruiz Architects';
const PROJECT_COUNT = Number(args.projects || 5);

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing from .env.local');
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(serviceAccountStr)) });
const db = getFirestore();
const auth = getAuth();

// ---------- fictional replacement data ----------
const PEOPLE = [
  'Clara Mendes', 'Tomas Lindqvist', 'Aiko Tanaka', 'Rafael Ortega', 'Nadia Haddad', 'Oliver Grant',
  'Priya Raman', 'Lukas Weber', 'Sofia Marchetti', 'Daniel Osei', 'Mei Lin', 'Hugo Laurent',
  'Ines Carvalho', 'Jonas Berg', 'Amara Nwosu', 'Felix Novak', 'Laila Rahimi', 'Mateo Rossi',
  'Hana Kim', 'Samuel Price', 'Elena Petrova', 'Kofi Mensah', 'Julia Santos', 'Arjun Mehta',
  'Freya Olsen', 'Diego Herrera', 'Yara Saleh', 'Leo Fischer', 'Noor Aziz', 'Ethan Cole',
  'Marta Kowalska', 'Ravi Kapoor', 'Chloe Martin', 'Bruno Costa', 'Anika Shah', 'Theo Dubois',
];
const PROJECT_NAMES = [
  'Harbour Lofts', 'Alder Street Clinic', 'Cedar Court Residences', 'Riverside Library',
  'Kestrel House', 'Northgate Offices', 'Maple Row Townhouses', 'Lumen Arts Centre',
];
const STUDIOS = ['Studio Lisbon', 'Studio Oslo', 'Studio Kyoto', 'Studio Austin', 'Studio Porto', 'Studio Cape Town'];
const STAGES = [
  { name: 'Concept design', desc: 'Site analysis, massing studies and design concept.', deliverables: 'Concept report, massing model, area schedule.' },
  { name: 'Schematic design', desc: 'Develop the chosen concept into coordinated plans and sections.', deliverables: 'Schematic plans, sections and elevations.' },
  { name: 'Design development', desc: 'Resolve layouts, materials and building systems.', deliverables: 'Developed drawings, outline specification.' },
  { name: 'Technical design', desc: 'Detailed design coordinated with engineers.', deliverables: 'Technical drawings, details and schedules.' },
  { name: 'Construction documents', desc: 'Full drawing and specification set for tender and construction.', deliverables: 'Construction drawing set, specification.' },
  { name: 'Tender support', desc: 'Support during tender and contractor selection.', deliverables: 'Tender queries log, tender report.' },
  { name: 'Construction support', desc: 'Site visits and responses to contractor queries.', deliverables: 'Site reports, RFI responses.' },
  { name: 'Visualisation', desc: 'Renders and presentation material.', deliverables: 'Exterior and interior renders.' },
];
const COST_NAMES = {
  rendering: ['Exterior renders', 'Interior renders', 'Aerial render'],
  trip: ['Site visit', 'Client workshop travel', 'Survey trip'],
  consultant: ['Structural engineer', 'MEP consultant', 'Landscape consultant'],
  other: ['Physical model', 'Printing and plotting', 'Topographic survey'],
};
const OVERHEAD_NAMES = {
  consult: ['Legal counsel', 'Auditors', 'Accounting services', 'Tax advisor', 'Company secretary', 'HR consultant', 'Insurance broker', 'Payroll service'],
  market: ['Client visits', 'Business development travel', 'Award entries', 'Website and PR', 'Conferences and events', 'Marketing materials', 'Trade fairs'],
  office: ['Studio rent', 'Utilities', 'Cleaning', 'Professional memberships', 'Professional indemnity insurance', 'Office supplies', 'Equipment insurance',
    'Health insurance', 'Training', 'Coworking desks', 'Couriers', 'Kitchen supplies', 'Furniture', 'Maintenance', 'Phone and internet'],
};
const STANDARD_TEMPLATE = /RIBA|RAIC|CSCAE|China/i;
const TASK_NAMES = ['Site analysis', 'Massing options', 'Plan layouts', 'Elevation studies', 'Section development',
  'Material palette', 'Client presentation', 'Coordination meeting', 'Detail drawings', 'Area schedule', 'Model update', 'Render review'];

// ---------- helpers ----------
let seed = 20261015;
const rand = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** random factor in ±10–20% (never within ±10%, so no figure stays near the original) */
const shift = () => { const m = 0.1 + rand() * 0.1; return rand() < 0.5 ? 1 - m : 1 + m; };
const roundTo = (n, step) => Math.round(n / step) * step;
const money = (n) => (n >= 1000 ? roundTo(n, 50) : n >= 100 ? roundTo(n, 5) : Math.round(n * 100) / 100);
const byCompany = async (col, companyId) => (await db.collection(col).where('companyId', '==', companyId).get()).docs;
const pick = (list, i) => list[i % list.length];

async function main() {
  console.log(WRITE ? '✍️  WRITE mode: the demo account will be created.\n' : '👀 Dry run: nothing will be written. Add --write to create the account.\n');

  // Source company
  const srcUser = await db.collection('users').where('email', '==', SOURCE_EMAIL).limit(1).get();
  if (srcUser.empty) throw new Error(`No user found with email ${SOURCE_EMAIL}`);
  const srcCompanyId = srcUser.docs[0].data().companyId;
  const srcCompany = (await db.collection('companies').doc(srcCompanyId).get()).data();
  console.log(`Source company: ${srcCompany.name} (${srcCompanyId})`);

  // Demo login must not already exist
  const existingDoc = await db.collection('users').where('email', '==', DEMO_EMAIL).limit(1).get();
  if (!existingDoc.empty) throw new Error(`${DEMO_EMAIL} already has an account in company ${existingDoc.docs[0].data().companyId}. Pick another --demo email or remove that account first.`);
  let existingAuth = null;
  try { existingAuth = await auth.getUserByEmail(DEMO_EMAIL); } catch (e) { if (e.code !== 'auth/user-not-found') throw e; }
  if (existingAuth) throw new Error(`${DEMO_EMAIL} already exists in Firebase Auth (uid ${existingAuth.uid}) without a company. Remove it in the Firebase console or pick another --demo email.`);

  // Load source data
  const [categories, members, projects, phases, allocations, costs, payments, tasks, blocks, overheads] = await Promise.all(
    ['categories', 'teamMembers', 'projects', 'phases', 'allocations', 'projectCosts', 'payments', 'projectTasks', 'documentBlocks', 'overheadsProfile']
      .map(c => byCompany(c, srcCompanyId))
  );

  // Pick the richest Active/Proposed projects (fall back to any non-template project)
  const count = (docs, pid) => docs.filter(d => d.data().projectId === pid).length;
  const score = (p) => count(phases, p.id) * 3 + count(allocations, p.id) + count(payments, p.id) * 2 + count(costs, p.id) + count(tasks, p.id);
  const candidates = projects.filter(p => !p.data().isTemplate && p.data().status !== 'Lost');
  const staffed = candidates.filter(p => count(allocations, p.id) > 0);
  const ranked = [...staffed].sort((a, b) => score(b) - score(a));
  if (ranked.length < PROJECT_COUNT) ranked.push(...candidates.filter(p => !staffed.includes(p)).sort((a, b) => score(b) - score(a)));
  const chosen = ranked.slice(0, PROJECT_COUNT);
  const templates = projects.filter(p => p.data().isTemplate && STANDARD_TEMPLATE.test(p.data().name));
  const chosenIds = new Set(chosen.map(p => p.id));

  console.log(`\nTeam: ${members.length} members in ${categories.length} categories`);
  console.log(`Projects to copy (${chosen.length}):`);
  chosen.forEach((p, i) => {
    const d = p.data();
    console.log(`  ${d.name}  →  ${PROJECT_NAMES[i]}   [${d.status || 'no status'}; ${count(phases, p.id)} phases, ${count(allocations, p.id)} allocations, ${count(payments, p.id)} payments, ${count(costs, p.id)} costs, ${count(tasks, p.id)} tasks]`);
  });
  console.log(`Standard templates to copy: ${templates.map(t => t.data().name).join(', ') || 'none'}`);
  if (!WRITE) {
    console.log(`\nWould create company "${DEMO_COMPANY}" with admin login ${DEMO_EMAIL}.`);
    console.log('Run again with --write to create it.');
    return;
  }

  // ---------- write ----------
  const writer = db.bulkWriter();
  const now = Date.now();
  const companyRef = db.collection('companies').doc();
  const companyId = companyRef.id;
  writer.set(companyRef, {
    name: DEMO_COMPANY,
    subscriptionStatus: 'lifetime',
    createdAt: now,
    ...(srcCompany.currency ? { currency: srcCompany.currency } : {}),
    ...(srcCompany.areaUnit ? { areaUnit: srcCompany.areaUnit } : {}),
    ...(srcCompany.tier ? { tier: srcCompany.tier } : {}),
    isDemo: true,
  });

  // Login
  const password = crypto.randomBytes(9).toString('base64url') + '-Demo7';
  const authUser = await auth.createUser({ email: DEMO_EMAIL, password, displayName: 'Demo Admin', emailVerified: true });
  writer.set(db.collection('users').doc(authUser.uid), { email: DEMO_EMAIL, displayName: 'Demo Admin', companyId, role: 'admin' });

  // Categories
  const catMap = {};
  let studio = 0;
  [...categories].sort((a, b) => (a.data().order ?? 99) - (b.data().order ?? 99)).forEach(c => {
    const d = c.data();
    const name = /partner/i.test(d.name) ? 'Partners'
      : /digital|comput/i.test(d.name) ? 'Digital'
      : /consult|freelan/i.test(d.name) ? 'Consultants'
      : /expens|other/i.test(d.name) ? 'Other expenses'
      : d.type === 'external' ? 'Associate studios'
      : pick(STUDIOS, studio++);
    const ref = db.collection('categories').doc();
    catMap[c.id] = ref.id;
    writer.set(ref, { ...d, companyId, name });
  });

  // Team (one overheads factor for everyone, since overheads are shared company-wide)
  const overheadsFactor = shift();
  const memberMap = {};
  const rateFactor = {}; // new costPerHour / old costPerHour, for allocation snapshots
  members.forEach((m, i) => {
    const d = m.data();
    const salary = money((d.salary || 0) * shift());
    const overheadsAmt = money((d.overheads || 0) * overheadsFactor);
    const oldTotal = (d.salary || 0) + (d.overheads || 0);
    const ratio = oldTotal > 0 ? (salary + overheadsAmt) / oldTotal : shift();
    const costPerHour = Math.round((d.costPerHour || 0) * ratio * 100) / 100;
    const ref = db.collection('teamMembers').doc();
    memberMap[m.id] = ref.id;
    rateFactor[m.id] = ratio;
    const out = { ...d, companyId, name: pick(PEOPLE, i), salary, overheads: overheadsAmt, costPerHour };
    delete out.avatarUrl;
    if ('id' in out) out.id = ref.id;
    if (d.roundedFeeHour !== undefined) out.roundedFeeHour = Math.round(costPerHour * 2.5 * 100) / 100;
    if (d.category) out.category = catMap[d.category] || d.category;
    if (d.nonBillableDescription) out.nonBillableDescription = 'Studio management and business development';
    writer.set(ref, out);
  });

  // Projects and their records
  const projectMap = {};
  const phaseMap = {};
  const phaseName = {};
  chosen.forEach((p, i) => {
    const d = p.data();
    const ref = db.collection('projects').doc();
    projectMap[p.id] = ref.id;
    const out = { companyId, name: PROJECT_NAMES[i], description: 'Sample project for demonstrations.', createdAt: d.createdAt || now };
    for (const k of ['profitMargin', 'startDate', 'status', 'isTemplate']) if (d[k] !== undefined) out[k] = d[k];
    if (d.area) out.area = roundTo(d.area * shift(), 10);
    out.ownerId = authUser.uid;
    writer.set(ref, out);

    phases.filter(ph => ph.data().projectId === p.id)
      .sort((a, b) => (a.data().order ?? 0) - (b.data().order ?? 0))
      .forEach((ph, j) => {
        const pd = ph.data();
        const stage = pick(STAGES, j);
        const pref = db.collection('phases').doc();
        phaseMap[ph.id] = pref.id;
        phaseName[ph.id] = stage.name;
        writer.set(pref, {
          companyId, projectId: ref.id, name: stage.name, description: stage.desc,
          tasks: pd.tasks ? stage.desc : '', inclusions: pd.inclusions ? 'Coordination with the client and consultants for this stage.' : '',
          omissions: pd.omissions ? 'Statutory fees and specialist surveys.' : '', deliverables: pd.deliverables ? stage.deliverables : '',
          durationWeeks: pd.durationWeeks, order: pd.order ?? j,
        });
      });
  });

  allocations.filter(a => chosenIds.has(a.data().projectId)).forEach(a => {
    const d = a.data();
    if (!phaseMap[d.phaseId] || !memberMap[d.memberId]) return;
    const out = { ...d, companyId, projectId: projectMap[d.projectId], phaseId: phaseMap[d.phaseId], memberId: memberMap[d.memberId] };
    delete out.member; // stale embedded copy of the source member (real name, salary)
    if (d.costPerHourSnapshot) out.costPerHourSnapshot = Math.round(d.costPerHourSnapshot * (rateFactor[d.memberId] || 1) * 100) / 100;
    writer.set(db.collection('allocations').doc(), out);
  });

  costs.filter(c => chosenIds.has(c.data().projectId)).forEach((c, i) => {
    const d = c.data();
    writer.set(db.collection('projectCosts').doc(), {
      ...d, companyId, projectId: projectMap[d.projectId], phaseId: phaseMap[d.phaseId] || d.phaseId,
      name: pick(COST_NAMES[d.type] || COST_NAMES.other, i), unitCost: money((d.unitCost || 0) * shift()),
    });
  });

  payments.filter(p => chosenIds.has(p.data().projectId)).forEach((p, i) => {
    const d = p.data();
    const out = { ...d, companyId, projectId: projectMap[d.projectId] };
    if (d.phaseId) { out.phaseId = phaseMap[d.phaseId] || d.phaseId; out.name = `${phaseName[d.phaseId] || 'Stage'} completion`; }
    else out.name = (d.order ?? i) === 0 ? 'Mobilisation' : `Milestone ${(d.order ?? i) + 1}`;
    writer.set(db.collection('payments').doc(), out);
  });

  tasks.filter(t => chosenIds.has(t.data().projectId)).forEach((t, i) => {
    const d = t.data();
    const out = { ...d, companyId, projectId: projectMap[d.projectId], phaseId: phaseMap[d.phaseId] || d.phaseId, name: pick(TASK_NAMES, i), description: '' };
    if (d.memberId) out.memberId = memberMap[d.memberId] || null;
    writer.set(db.collection('projectTasks').doc(), out);
  });

  // Standard templates: public stage frameworks, copied without changes
  templates.forEach(t => {
    const ref = db.collection('projects').doc();
    writer.set(ref, { ...t.data(), companyId, ownerId: authUser.uid });
    const tplPhase = {};
    phases.filter(ph => ph.data().projectId === t.id).forEach(ph => {
      const pref = db.collection('phases').doc();
      tplPhase[ph.id] = pref.id;
      writer.set(pref, { ...ph.data(), companyId, projectId: ref.id });
    });
    payments.filter(p => p.data().projectId === t.id).forEach(p => {
      const d = p.data();
      writer.set(db.collection('payments').doc(), { ...d, companyId, projectId: ref.id, ...(d.phaseId ? { phaseId: tplPhase[d.phaseId] || d.phaseId } : {}) });
    });
  });

  // Document blocks: generated blocks are copied; free-text blocks get neutral sample copy.
  blocks.filter(b => !b.data().projectId || chosenIds.has(b.data().projectId)).forEach(b => {
    const d = b.data();
    const out = { ...d, companyId };
    if (d.projectId) out.projectId = projectMap[d.projectId];
    if (d.type === 'rich_text') {
      const terms = /terms|condition/i.test(d.title || '');
      out.title = terms ? 'Terms & Conditions' : 'Introduction';
      out.content = terms
        ? '<p>Fees exclude VAT and statutory charges. Invoices are payable within 30 days. Additional services outside the scope above are charged at our standard hourly rates.</p><p>This proposal is valid for 90 days.</p>'
        : `<p>${DEMO_COMPANY} is pleased to submit this fee proposal. It sets out our understanding of the brief, the scope of services for each stage, the team and the fee.</p><p>This is a sample document for demonstrations.</p>`;
    }
    writer.set(db.collection('documentBlocks').doc(), out);
  });

  // Overheads profile
  overheads.slice(0, 1).forEach(o => {
    const d = o.data();
    writer.set(db.collection('overheadsProfile').doc(), {
      ...d, companyId, updatedAt: now,
      yearlyIncomeTarget: money((d.yearlyIncomeTarget || 0) * shift()),
      ...(d.calculatedOverheadPerPerson ? { calculatedOverheadPerPerson: money(d.calculatedOverheadPerPerson * overheadsFactor) } : {}),
      categories: (d.categories || []).map(cat => {
        const keep = /\bIT\b|software/i.test(cat.name);
        const list = /consult|corp/i.test(cat.name) ? OVERHEAD_NAMES.consult : /market|BD/i.test(cat.name) ? OVERHEAD_NAMES.market : OVERHEAD_NAMES.office;
        return {
          ...cat, items: (cat.items || []).map((it, i) => ({
            ...it, name: keep ? it.name : (i < list.length ? list[i] : `${list[i % list.length]} ${Math.floor(i / list.length) + 1}`),
            yearlyCost: money((it.yearlyCost || 0) * shift()),
          })),
        };
      }),
    });
  });

  await writer.close();
  console.log(`\n✅ Created "${DEMO_COMPANY}" (${companyId})`);
  console.log(`   Login: ${DEMO_EMAIL}`);
  console.log(`   Password: ${password}`);
  console.log('   Save the password now; it is not stored anywhere else.');
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });

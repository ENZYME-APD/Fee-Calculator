/*
 * One-off clean-up after the Financial forecast prototype.
 *
 * The prototype shipped Enzyme's spreadsheet inside the app and auto-saved it
 * into the forecast of ANY company that opened /forecast. This script:
 *   1. lists every company's saved forecast and flags copies of Enzyme's data,
 *   2. with --write, deletes those copies from other companies,
 *   3. with --write, makes sure Enzyme's own forecast exists (seeding it from
 *      scripts/data/enzyme-forecast-baseline.json only if it's missing or empty).
 *
 * Usage (repo root, production service account in .env.local):
 *   node --env-file=.env.local scripts/forecast-cleanup.js           (report only)
 *   node --env-file=.env.local scripts/forecast-cleanup.js --write   (clean up)
 *
 * Once Enzyme's forecast looks right in the app, delete
 * scripts/data/enzyme-forecast-baseline.json from the repo.
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const WRITE = process.argv.includes('--write');
const ENZYME_EMAIL = 'j.beneitez@weareenzyme.com';

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing from .env.local');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountStr)) });
const db = admin.firestore();

// Fingerprint of the prototype's spreadsheet rows/outflows.
const isBaselineCopy = (d) =>
  (d.rows || []).some(r => typeof r.id === 'string' && r.id.startsWith('row_ss_')) ||
  (d.outflows || []).some(o => o.id === 'debt_partner_3' || o.id === 'partner_simon');

async function main() {
  console.log(WRITE ? '✍️  WRITE mode\n' : '👀 Report only. Add --write to clean up.\n');

  const enzymeUser = await db.collection('users').where('email', '==', ENZYME_EMAIL).limit(1).get();
  if (enzymeUser.empty) throw new Error(`No user ${ENZYME_EMAIL}`);
  const enzymeCompanyId = enzymeUser.docs[0].data().companyId;

  const snap = await db.collection('forecastProfile').get();
  const companyName = async (id) => (await db.collection('companies').doc(id).get()).data()?.name || '(deleted company)';

  let enzymeDoc = null;
  const leaked = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const name = await companyName(d.companyId);
    const copy = isBaselineCopy(d);
    const mine = d.companyId === enzymeCompanyId;
    console.log(`${mine ? '★' : copy ? '⚠️ ' : '  '} ${name} (${d.companyId}): ${(d.rows || []).length} rows${copy && !mine ? '  ← contains Enzyme data' : ''}`);
    if (mine) enzymeDoc = doc;
    else if (copy) leaked.push(doc);
  }
  if (!snap.size) console.log('No saved forecasts.');

  console.log(`\n${leaked.length} other compan${leaked.length === 1 ? 'y has' : 'ies have'} a copy of Enzyme's data.`);
  const enzymeEmpty = !enzymeDoc || !(enzymeDoc.data().rows || []).length;
  console.log(enzymeEmpty ? "Enzyme's forecast is missing or empty: it will be seeded from the spreadsheet baseline." : "Enzyme's forecast exists and will be left as it is.");
  if (!WRITE) return;

  for (const doc of leaked) await doc.ref.delete();
  if (leaked.length) console.log(`🗑  Deleted ${leaked.length} leaked cop${leaked.length === 1 ? 'y' : 'ies'}.`);

  if (enzymeEmpty) {
    const file = path.join(__dirname, 'data', 'enzyme-forecast-baseline.json');
    const base = JSON.parse(fs.readFileSync(file, 'utf8'));
    const data = {
      companyId: enzymeCompanyId,
      startMonthKey: base.settings.startMonthKey,
      openingMonthKey: base.settings.startMonthKey,
      visibleMonthsCount: base.settings.visibleMonthsCount,
      startingBankBalance: base.settings.startingBankBalance,
      possibleConversionPercent: base.settings.possibleConversion,
      invoicingConversionPercent: base.settings.invoicingConversion,
      rows: base.rows,
      // The fixed costs line repeats every month instead of stopping after the spreadsheet's last column.
      outflows: base.outflows.map(o => (o.id === 'burn_base' ? { ...o, defaultMonthlyAmount: 42000 } : o)),
      updatedAt: Date.now(),
    };
    if (enzymeDoc) await enzymeDoc.ref.set(data);
    else await db.collection('forecastProfile').add(data);
    console.log("🌱 Seeded Enzyme's forecast.");
  }
  console.log('\n✅ Done. Check Financial forecast in the Enzyme account, then delete scripts/data/enzyme-forecast-baseline.json.');
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });

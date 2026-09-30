const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const pids = [
    'Y6OyqZWUBSk7eFdSX4hU',
    'MOkx2eU4rWzWhodLoH4C',
    'Q6iIOIkuKfi0MKvzyktY',
    '1vKyR2Ndi1NQCMHgBH7t',
    'Mt5Nd9I3cZoIUhIqtnGW',
    'uMatsUhy4Rfb6clnH9kZ',
    'Ow9Ncexa8QybwarcJuUF',
    'r431BQVju5qIezsUF9Jt',
    'CXctv6zPF4eHC1lerTHT',
    'PRcNxkiY9im6Vic2MUHi',
    'UoZ0R1VGWyJzheSuLF4c',
    'Ib9Vss637q3RPbr8GL9h'
  ];
  for (const pid of pids) {
    const doc = await db.collection('phases').doc(pid).get();
    console.log("Phase", pid, "projectId:", doc.data().projectId, "name:", doc.data().name);
  }
}

run().catch(console.error);

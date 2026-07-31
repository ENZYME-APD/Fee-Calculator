const admin = require('firebase-admin');

// 1. Get the email argument from the command line
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address.");
  console.error("Usage: node --env-file=.env.local scripts/grant-lifetime.js user@example.com");
  process.exit(1);
}

// 2. Initialize Firebase Admin
try {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountStr) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing from .env.local");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountStr)),
  });
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error.message);
  process.exit(1);
}

const db = admin.firestore();

async function grantLifetime() {
  try {
    console.log(`🔍 Searching for user: ${email}...`);
    
    // 3. Find the user in the 'users' collection
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      console.error(`❌ No user found with email ${email}`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const companyId = userDoc.data().companyId;

    if (!companyId) {
      console.error(`❌ User ${email} does not belong to a company.`);
      process.exit(1);
    }

    console.log(`✅ Found user. Company ID: ${companyId}`);
    console.log(`⚙️  Updating company subscription status to 'lifetime'...`);

    // 4. Update the company's subscription status
    await db.collection('companies').doc(companyId).update({
      subscriptionStatus: 'lifetime'
    });

    console.log(`🎉 SUCCESS! The company has been granted permanent lifetime access.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

grantLifetime();

const fs = require('fs');

const file = 'src/app/api/stripe/webhook/route.ts';
let code = fs.readFileSync(file, 'utf8');

// Modify checkout.session.completed
const oldCheckout = `          await db.collection('companies').doc(companyId).update({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
          });`;

const newCheckout = `          await db.collection('companies').doc(companyId).update({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
            tier: 'pro',
          });`;

code = code.replace(oldCheckout, newCheckout);

// Modify customer.subscription.updated
const oldUpdated = `          await companyDoc.ref.update({
            subscriptionStatus: subscription.status, // 'active', 'past_due', 'canceled', etc
          });`;

const newUpdated = `          await companyDoc.ref.update({
            subscriptionStatus: subscription.status, // 'active', 'past_due', 'canceled', etc
            tier: subscription.status === 'active' || subscription.status === 'trialing' ? 'pro' : 'basic',
          });`;

code = code.replace(oldUpdated, newUpdated);

// Modify customer.subscription.deleted
const oldDeleted = `          await companyDoc.ref.update({
            subscriptionStatus: 'canceled',
          });`;

const newDeleted = `          await companyDoc.ref.update({
            subscriptionStatus: 'canceled',
            tier: 'basic',
          });`;

code = code.replace(oldDeleted, newDeleted);

fs.writeFileSync(file, code);

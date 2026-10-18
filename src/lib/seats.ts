import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

// Users and billing. Each plan includes 5 users; admins and members count, viewers are free. The
// Stripe prices are graduated tiers (first 5 included in the plan price, then a price per extra user),
// so the subscription quantity is simply the number of paying users (at least 1). Trials and lifetime
// accounts have no limit. Pending invites for admins or members count too, so nobody can invite past
// what's been paid for.

export const INCLUDED_USERS = 5;
export const EXTRA_USER_PRICE = { month: 1.99, year: 7.99 } as const;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });

const PLAN_PRICES = () => [process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY, process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY].filter(Boolean) as string[];
export const isPlanPrice = (priceId: string) => PLAN_PRICES().includes(priceId);

const PAYING_ROLES = new Set(['admin', 'member']);

export async function payingUsers(companyId: string): Promise<{ users: number; invites: number }> {
  const [users, invites] = await Promise.all([
    adminDb!.collection('users').where('companyId', '==', companyId).get(),
    adminDb!.collection('invites').where('companyId', '==', companyId).get(),
  ]);
  return {
    users: users.docs.filter(d => PAYING_ROLES.has(d.data().role)).length,
    invites: invites.docs.filter(d => PAYING_ROLES.has(d.data().role)).length,
  };
}

export type BillingMode = 'subscription' | 'trial' | 'lifetime' | 'none';

export interface SeatState {
  included: number;
  used: number; // paying users + pending paying invites
  capacity: number; // users paid for (at least the included ones)
  quantity: number; // subscription quantity
  mode: BillingMode;
  interval: 'month' | 'year' | null;
  extraPrice: number | null; // per extra user per interval
  subscriptionId: string | null;
  itemId: string | null;
}

export async function seatState(companyId: string): Promise<SeatState> {
  const company = (await adminDb!.collection('companies').doc(companyId).get()).data() || {};
  const count = await payingUsers(companyId);
  const used = count.users + count.invites;
  const base: SeatState = { included: INCLUDED_USERS, used, capacity: INCLUDED_USERS, quantity: 0, mode: 'none', interval: null, extraPrice: null, subscriptionId: null, itemId: null };

  if (company.subscriptionStatus === 'lifetime') return { ...base, mode: 'lifetime', capacity: Infinity };
  if (company.subscriptionStatus === 'trialing' && (!company.trialEndsAt || Date.now() <= company.trialEndsAt)) return { ...base, mode: 'trial', capacity: Infinity };

  if (company.stripeSubscriptionId && ['active', 'past_due'].includes(company.subscriptionStatus)) {
    try {
      const sub = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);
      const item = sub.items.data.find(i => isPlanPrice(i.price.id)) || sub.items.data[0];
      if (item) {
        const interval = item.price.recurring?.interval === 'year' ? 'year' : 'month';
        const quantity = item.quantity || 1;
        return {
          ...base, mode: 'subscription', quantity, capacity: Math.max(INCLUDED_USERS, quantity), interval,
          extraPrice: EXTRA_USER_PRICE[interval], subscriptionId: sub.id, itemId: item.id,
        };
      }
    } catch (e) {
      console.error('Could not read subscription', e);
    }
  }
  return base;
}

/** Changes how many users the subscription pays for. Prorated onto the next invoice. */
export async function setPaidUsers(state: SeatState, users: number) {
  if (state.mode !== 'subscription' || !state.itemId) throw new Error('No active subscription to change.');
  const quantity = Math.max(1, Math.round(users));
  await stripe.subscriptionItems.update(state.itemId, { quantity, proration_behavior: 'create_prorations' });
  return quantity;
}

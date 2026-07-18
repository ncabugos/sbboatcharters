import Stripe from 'stripe';

// Direct charges on the operator's Standard connected account; the platform
// collects application_fee_amount on each payment (see lib/pricing.js).
let cached;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!cached) cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  return cached;
}

export function connectedAccount() {
  return process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID || null;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && connectedAccount());
}

// Options object for calls that must run on the connected account.
export function onConnected() {
  const acct = connectedAccount();
  return acct ? { stripeAccount: acct } : {};
}

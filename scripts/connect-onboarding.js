#!/usr/bin/env node
/**
 * Create (or re-link) the operator's Stripe connected account and print a
 * hosted onboarding URL to send to them.
 *
 * Usage (run with the PLATFORM secret key — live or test):
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/connect-onboarding.js
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/connect-onboarding.js acct_XXXX   # new link for existing account
 *
 * Notes:
 * - Onboarding links are single-use and short-lived: generate one right when
 *   the operator is ready to click it. If it expires, just run this again
 *   with the acct id — progress is saved on Stripe's side.
 * - Standard account: free for the platform; operator gets the full Stripe
 *   dashboard (payments, refunds, payouts).
 */

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY (the PLATFORM secret key) in the environment.');
  process.exit(1);
}
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';

async function stripe(path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(key + ':').toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

(async () => {
  let acct = process.argv[2];

  if (!acct) {
    const account = await stripe('accounts', {
      type: 'standard',
      country: 'US',
      email: 'garrick.gch@gmail.com',
      'business_profile[url]': 'https://www.sbboatcharters.com',
      'business_profile[mcc]': '4457', // marinas & boat rental
      'business_profile[product_description]': 'Private boat charter tours in Santa Barbara',
    });
    acct = account.id;
    console.log(`\n[${mode}] Created connected account: ${acct}`);
    console.log('Save this as NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID in Vercel.');
  } else {
    console.log(`\n[${mode}] Using existing account: ${acct}`);
  }

  const link = await stripe('account_links', {
    account: acct,
    type: 'account_onboarding',
    refresh_url: 'https://www.sbboatcharters.com/admin',
    return_url: 'https://www.sbboatcharters.com/admin',
  });

  console.log('\nOnboarding link (single-use — send it when they are ready to fill it out):');
  console.log(`\n  ${link.url}\n`);
  console.log('If it expires before they finish, rerun:');
  console.log(`  STRIPE_SECRET_KEY=sk_... node scripts/connect-onboarding.js ${acct}\n`);
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

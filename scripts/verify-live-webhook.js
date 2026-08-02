#!/usr/bin/env node
/**
 * Verify the LIVE Stripe webhook endpoint end-to-end without moving any money.
 *
 * Sends a properly-signed synthetic `payment_intent.succeeded` to production.
 * The payload carries empty metadata, so the handler matches neither the
 * `booking` nor the `gift_card` branch and simply returns {received:true} —
 * no database writes beyond the idempotency row, no emails, no refunds.
 *
 * Usage:
 *   STRIPE_WEBHOOK_SECRET=whsec_... node scripts/verify-live-webhook.js
 *
 * Reads the secret from the env var of the same name (never hardcode it).
 */
const crypto = require('crypto');

const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const URL =
  process.env.WEBHOOK_URL || 'https://www.sbboatcharters.com/api/webhooks/stripe/';

if (!SECRET || !SECRET.startsWith('whsec_')) {
  console.error(
    'Missing STRIPE_WEBHOOK_SECRET (must start with whsec_).\n' +
      'Get it from Stripe → Developers → Webhooks → your endpoint → Signing secret → Reveal.\n\n' +
      'Note: whsec_... is the SIGNING SECRET. we_... is the endpoint ID — not the same thing.'
  );
  process.exit(1);
}

// Unique id each run so the handler's idempotency gate doesn't short-circuit us.
const eventId = `evt_verify_${crypto.randomBytes(12).toString('hex')}`;
const payload = JSON.stringify({
  id: eventId,
  object: 'event',
  type: 'payment_intent.succeeded',
  livemode: true,
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: `pi_verify_${crypto.randomBytes(8).toString('hex')}`,
      object: 'payment_intent',
      amount: 0,
      currency: 'usd',
      status: 'succeeded',
      metadata: {}, // deliberately empty -> handler no-ops
    },
  },
});

const timestamp = Math.floor(Date.now() / 1000);
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

function verdict(status, body) {
  if (status === 200) {
    return [
      '✅ PASS — the live webhook is wired correctly.',
      '   URL resolves (no 308), signature verified against STRIPE_WEBHOOK_SECRET,',
      '   and both Stripe keys are present in Vercel. Real bookings will confirm.',
    ].join('\n');
  }
  if (status === 400) {
    return [
      '❌ BAD SIGNATURE — STRIPE_WEBHOOK_SECRET in Vercel does not match this endpoint.',
      '   Customers would be charged and bookings would stay `pending` forever.',
      '   Fix: copy the signing secret from the Stripe dashboard into Vercel, redeploy.',
      '   (Check you used whsec_..., not the we_... endpoint id.)',
    ].join('\n');
  }
  if (status === 503) {
    return [
      '❌ NOT CONFIGURED — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is missing in Vercel.',
      '   Fix: add them to Production env vars and redeploy (env changes need a rebuild).',
    ].join('\n');
  }
  if (status === 308 || status === 301 || status === 302) {
    return [
      `❌ REDIRECT (${status}) — the URL lost its trailing slash.`,
      '   Stripe does NOT follow redirects on webhook delivery: deliveries fail silently.',
      '   Fix: endpoint URL must end in /api/webhooks/stripe/ (with the slash).',
    ].join('\n');
  }
  return `⚠️  Unexpected ${status}. Body: ${body}`;
}

(async () => {
  console.log(`POST ${URL}`);
  const res = await fetch(URL, {
    method: 'POST',
    redirect: 'manual', // surface a 308 instead of hiding it
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${timestamp},v1=${signature}`,
    },
    body: payload,
  });
  const body = await res.text();
  console.log(`HTTP ${res.status}  ${body}\n`);
  console.log(verdict(res.status, body));
  process.exit(res.status === 200 ? 0 : 1);
})().catch((err) => {
  console.error('Request failed:', err.message);
  process.exit(1);
});

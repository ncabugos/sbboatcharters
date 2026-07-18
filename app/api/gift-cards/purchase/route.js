import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateCode } from '@/lib/giftCards';
import { displayFromBase } from '@/lib/pricing';
import { getStripe, onConnected, stripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const MIN_CENTS = 5000;     // $50
const MAX_CENTS = 200000;   // $2,000

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { amountCents, purchaserName, purchaserEmail, recipientName, recipientEmail, message, company } = body || {};
  if (company) return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); // honeypot

  const amount = Number(amountCents);
  if (!Number.isInteger(amount) || amount < MIN_CENTS || amount > MAX_CENTS || amount % 100 !== 0) {
    return NextResponse.json({ error: 'Amount must be between $50 and $2,000 in whole dollars' }, { status: 400 });
  }
  const email = String(purchaserEmail || '').trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
  }
  const recEmail = String(recipientEmail || '').trim().toLowerCase().slice(0, 200);
  if (recEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recEmail)) {
    return NextResponse.json({ error: 'Recipient email is invalid' }, { status: 400 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet. Please call (805) 722-2282.' },
      { status: 503 }
    );
  }

  try {
    const chargeCents = displayFromBase(amount); // all-in: value + 6% fee, whole dollars
    const code = generateCode();
    const rows = await sql`
      INSERT INTO gift_cards (code, initial_cents, balance_cents, purchaser_name, purchaser_email,
                              recipient_name, recipient_email, message)
      VALUES (${code}, ${amount}, ${amount}, ${String(purchaserName || '').trim().slice(0, 120) || null},
              ${email}, ${String(recipientName || '').trim().slice(0, 120) || null},
              ${recEmail || null}, ${String(message || '').trim().slice(0, 500) || null})
      RETURNING id`;
    const cardId = rows[0].id;

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create(
      {
        amount: chargeCents,
        currency: 'usd',
        application_fee_amount: chargeCents - amount,
        automatic_payment_methods: { enabled: true },
        description: `Gift card — $${amount / 100}`,
        receipt_email: email,
        metadata: { kind: 'gift_card', gift_card_id: String(cardId) },
      },
      onConnected()
    );

    return NextResponse.json({ clientSecret: intent.client_secret, chargeCents });
  } catch (err) {
    console.error('[gift-card purchase]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

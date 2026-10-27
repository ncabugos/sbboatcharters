import { NextResponse, after } from 'next/server';
import { sql, withTransaction } from '@/lib/db';
import { getStripe, onConnected } from '@/lib/stripe';
import { redeemWithinTx } from '@/lib/giftCards';
import { loadBookingDetails } from '@/lib/bookings';
import {
  sendBookingConfirmation, sendCaptainNotification, sendBookingApology,
  sendGiftCardDelivery, sendGiftCardReceipt, sendGiftCardSaleNotification,
} from '@/lib/email';
import { syncContact, bookingContact, giftCardContacts } from '@/lib/hubspot.mjs';

export const dynamic = 'force-dynamic';

const EXCLUSION_VIOLATION = '23P01';

export async function POST(request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('[webhook] bad signature:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency gate — Stripe retries deliveries.
  const inserted = await sql`
    INSERT INTO webhook_events (stripe_event_id, type)
    VALUES (${event.id}, ${event.type})
    ON CONFLICT DO NOTHING
    RETURNING stripe_event_id`;
  if (inserted.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const kind = intent.metadata?.kind;
      if (kind === 'booking') await handleBookingPaid(intent);
      else if (kind === 'gift_card') await handleGiftCardPaid(intent);
    }
    // payment_intent.payment_failed / .canceled: no-op — the hold simply expires.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook]', event.type, err);
    // Non-2xx makes Stripe retry; remove the idempotency row so the retry can run.
    await sql`DELETE FROM webhook_events WHERE stripe_event_id = ${event.id}`;
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleBookingPaid(intent) {
  const bookingId = intent.metadata.booking_id;
  const giftCardId = intent.metadata.gift_card_id ? Number(intent.metadata.gift_card_id) : null;
  const giftCardCents = Number(intent.metadata.gift_card_cents || 0);
  if (!bookingId) return;

  let outcome;
  try {
    outcome = await withTransaction(async (tx) => {
      // Re-confirming an 'expired' row re-enters the exclusion constraint's
      // scope — if the slot was retaken meanwhile, this throws 23P01.
      const rows = await tx`
        UPDATE bookings
        SET status = 'confirmed', expires_at = NULL
        WHERE id = ${bookingId} AND status IN ('pending','expired')
        RETURNING id`;
      if (rows.length === 0) {
        // Already confirmed, or the hold was cancelled (admin, or the guest's
        // own edit) while the payment form was still open.
        const existing = await tx`SELECT status FROM bookings WHERE id = ${bookingId}`;
        return existing[0]?.status || 'missing';
      }
      if (giftCardId && giftCardCents > 0) {
        await redeemWithinTx(tx, giftCardId, bookingId, giftCardCents);
      }
      return 'confirmed';
    });
  } catch (err) {
    if (err?.code === EXCLUSION_VIOLATION) {
      // Paid after the hold expired AND the slot was retaken.
      await refundLostBooking(intent, bookingId, 'slot retaken');
      return;
    }
    throw err;
  }
  if (outcome === 'cancelled') {
    // Money taken for a hold that no longer exists: give it back, never keep it silently.
    await refundLostBooking(intent, bookingId, 'hold cancelled');
    return;
  }
  if (outcome !== 'confirmed') return;

  const details = await loadBookingDetails(bookingId);
  if (details?.status === 'confirmed') {
    await sendBookingConfirmation(details);
    await sendCaptainNotification(details);
    after(() => syncContact(bookingContact(details)));
  }
}

// Full refund for a payment that landed on a booking we can no longer honor.
// The idempotency key makes a Stripe retry of this webhook harmless: Stripe
// returns the original refund instead of raising charge_already_refunded.
async function refundLostBooking(intent, bookingId, why) {
  console.warn(`[webhook] ${why} after payment; refunding`, bookingId);
  const stripe = getStripe();
  try {
    await stripe.refunds.create(
      { payment_intent: intent.id, reason: 'requested_by_customer' },
      { ...onConnected(), idempotencyKey: `refund-${intent.id}` }
    );
  } catch (err) {
    if (err?.code !== 'charge_already_refunded') throw err;
  }
  await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${bookingId}`;
  const details = await loadBookingDetails(bookingId);
  if (details?.customer_email) await sendBookingApology(details);
}

async function handleGiftCardPaid(intent) {
  const cardId = Number(intent.metadata.gift_card_id);
  if (!cardId) return;
  const rows = await sql`
    UPDATE gift_cards
    SET status = 'active', stripe_payment_intent_id = ${intent.id}
    WHERE id = ${cardId} AND status = 'pending_payment'
    RETURNING *`;
  const card = rows[0];
  if (!card) return; // already activated
  const withCharge = { ...card, charged_cents: intent.amount };
  await sendGiftCardDelivery(withCharge);
  await sendGiftCardReceipt(withCharge);
  await sendGiftCardSaleNotification(withCharge);
  after(() => Promise.all(giftCardContacts(card).map(syncContact)));
}

import { NextResponse } from 'next/server';
import { sql, withTransaction } from '@/lib/db';
import { validateSlot, BUFFER_MIN } from '@/lib/availability';
import { taxFromBase } from '@/lib/pricing';
import { findActiveCard, redeemWithinTx } from '@/lib/giftCards';
import { getStripe, onConnected, stripeConfigured } from '@/lib/stripe';
import { sendBookingConfirmation, sendCaptainNotification } from '@/lib/email';
import { loadBookingDetails } from '@/lib/bookings';

export const dynamic = 'force-dynamic';

const HOLD_MINUTES = 30;
const EXCLUSION_VIOLATION = '23P01';

function bad(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function upsertCustomer(tx, { name, email, phone }) {
  const rows = await tx`
    INSERT INTO customers (name, email, phone)
    VALUES (${name}, ${email}, ${phone || null})
    ON CONFLICT ((lower(email)))
    DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(EXCLUDED.phone, customers.phone)
    RETURNING id`;
  return rows[0].id;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid request');
  }

  const {
    tour: tourSlug, pricingOptionId, date, time,
    partySize, name, email, phone, notes, giftCardCode,
    // set when the user edits their selection after a hold was created,
    // so their own previous hold doesn't block them
    replaceBookingId,
    // anti-spam, mirroring the contact form
    company, elapsedMs,
  } = body || {};

  if (company) return bad('Invalid request'); // honeypot
  if (typeof elapsedMs === 'number' && elapsedMs < 2000) return bad('Please take a moment and try again');

  if (!tourSlug || !pricingOptionId || !date || !time) return bad('Missing booking details');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return bad('Invalid date or time');
  const party = Number(partySize);
  const cleanName = String(name || '').trim().slice(0, 120);
  const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 200);
  const cleanPhone = String(phone || '').trim().slice(0, 40);
  const cleanNotes = String(notes || '').trim().slice(0, 1000);
  if (cleanName.length < 2) return bad('Please enter your name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return bad('Please enter a valid email');

  try {
    // 1. Sweep stale holds so they stop blocking the exclusion constraint.
    await sql`
      UPDATE bookings SET status = 'expired'
      WHERE status = 'pending' AND expires_at < now()`;
    if (typeof replaceBookingId === 'string' && /^[0-9a-f-]{36}$/.test(replaceBookingId)) {
      // Only unpaid pending holds can be replaced; harmless if id is bogus.
      await sql`
        UPDATE bookings SET status = 'cancelled'
        WHERE id = ${replaceBookingId} AND status = 'pending'`;
    }

    // 2. Re-validate the slot server-side (same engine as the picker).
    const slot = await validateSlot({
      tourSlug, pricingOptionId, dateStr: date, timeStr: time, partySize: party,
    });
    if (!slot.ok) {
      const messages = {
        unknown_tour: 'Unknown tour',
        unknown_option: 'Unknown pricing option',
        invalid_party_size: 'Invalid party size',
        slot_unavailable: 'That time is no longer available. Please pick another.',
      };
      return bad(messages[slot.reason] || 'Unavailable', slot.reason === 'slot_unavailable' ? 409 : 400);
    }
    const { tour, option, tripStart, tripEnd } = slot;

    // 3. Gift card (optional).
    let card = null;
    if (giftCardCode) {
      card = await findActiveCard(giftCardCode);
      if (!card) return bad('Gift card code is invalid or has no remaining balance');
    }

    // Mirrors FareHarbor: advertised price (base + 6% fee) + sales tax on the base.
    const taxCents = taxFromBase(option.base_cents);
    const totalCents = option.display_cents + taxCents;
    const giftCardCents = card ? Math.min(card.balance_cents, totalCents) : 0;
    const chargeCents = totalCents - giftCardCents;
    // Platform fee = the 6% built into the advertised price — never a cut of
    // the tax, which passes through to the operator in full. Capped by the
    // actual charge when a gift card covers most of it.
    const applicationFee = Math.min(option.display_cents - option.base_cents, chargeCents);

    // 4. Insert the pending hold (+ customer) in one transaction.
    let booking;
    try {
      booking = await withTransaction(async (tx) => {
        const customerId = await upsertCustomer(tx, {
          name: cleanName, email: cleanEmail, phone: cleanPhone,
        });
        const rows = await tx`
          INSERT INTO bookings (
            tour_id, pricing_option_id, customer_id, party_size,
            trip_start, trip_end, block_range, status, expires_at,
            base_cents, fee_cents, tax_cents, gift_card_cents, charged_cents, notes
          ) VALUES (
            ${tour.id}, ${option.id}, ${customerId}, ${party},
            ${tripStart.toISOString()}, ${tripEnd.toISOString()},
            tstzrange(${tripStart.toISOString()}, ${new Date(tripEnd.getTime() + BUFFER_MIN * 60000).toISOString()}),
            'pending', now() + (${HOLD_MINUTES} * interval '1 minute'),
            ${option.base_cents}, ${applicationFee}, ${taxCents}, ${giftCardCents}, ${chargeCents}, ${cleanNotes || null}
          )
          RETURNING id, confirmation_token`;
        return rows[0];
      });
    } catch (err) {
      if (err?.code === EXCLUSION_VIOLATION) {
        return bad('That time was just taken. Please pick another slot.', 409);
      }
      throw err;
    }

    // 5. Fully covered by gift card → confirm now, no Stripe involved.
    if (chargeCents === 0) {
      await withTransaction(async (tx) => {
        await redeemWithinTx(tx, card.id, booking.id, giftCardCents);
        await tx`UPDATE bookings SET status = 'confirmed', expires_at = NULL WHERE id = ${booking.id}`;
      });
      const details = await loadBookingDetails(booking.id);
      await sendBookingConfirmation(details);
      await sendCaptainNotification(details);
      return NextResponse.json({ confirmed: true, token: booking.confirmation_token });
    }

    // 6. Create the PaymentIntent on the connected account (direct charge + platform fee).
    if (!stripeConfigured()) {
      return bad('Payments are not configured yet. Please call (805) 722-2282 to book.', 503);
    }
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create(
      {
        amount: chargeCents,
        currency: 'usd',
        application_fee_amount: applicationFee,
        automatic_payment_methods: { enabled: true },
        description: `${tour.name} — ${option.label}`,
        receipt_email: cleanEmail,
        metadata: {
          kind: 'booking',
          booking_id: booking.id,
          gift_card_id: card ? String(card.id) : '',
          gift_card_cents: String(giftCardCents),
        },
      },
      onConnected()
    );
    await sql`
      UPDATE bookings SET stripe_payment_intent_id = ${intent.id} WHERE id = ${booking.id}`;

    return NextResponse.json({
      clientSecret: intent.client_secret,
      bookingId: booking.id,
      token: booking.confirmation_token,
      amountCents: chargeCents,
      holdMinutes: HOLD_MINUTES,
    });
  } catch (err) {
    console.error('[checkout]', err);
    return bad('Something went wrong. Please try again or call (805) 722-2282.', 500);
  }
}

import { NextResponse, after } from 'next/server';
import { sql, withTransaction } from '@/lib/db';
import { validateSlot, BUFFER_MIN } from '@/lib/availability';
import { taxFromBase } from '@/lib/pricing';
import { findActiveCard, redeemWithinTx } from '@/lib/giftCards';
import { getStripe, onConnected, stripeConfigured } from '@/lib/stripe';
import { sendBookingConfirmation, sendCaptainNotification } from '@/lib/email';
import { loadBookingDetails } from '@/lib/bookings';
import { syncContact, bookingContact } from '@/lib/hubspot.mjs';

export const dynamic = 'force-dynamic';

const HOLD_MINUTES = 15;
// Online booking stops here; anything further out is a phone call. Without a
// horizon a script could hold every slot on the calendar for years ahead.
const MAX_DAYS_AHEAD = 365;
// Caps on unpaid holds. A guest editing their selection replaces their previous
// hold (replaceBookingId), so a real guest never has more than one or two live.
const MAX_LIVE_HOLDS_PER_EMAIL = 3;
const MAX_HOLDS_PER_IP_PER_HOUR = 10;
const EXCLUSION_VIOLATION = '23P01';

class HoldCapError extends Error {}

function bad(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded ? forwarded.split(',')[0].trim() : '';
  return (first || request.headers.get('x-real-ip') || '').slice(0, 64) || null;
}

function horizonDate() {
  return new Date(Date.now() + MAX_DAYS_AHEAD * 86400000).toISOString().slice(0, 10);
}

// Runs inside the hold transaction. The customer row lock from upsertCustomer
// serializes same-email requests; the advisory lock does the same per IP, so a
// burst of concurrent requests cannot all pass the count before any inserts.
async function enforceHoldCaps(tx, customerId, ip) {
  const [{ live }] = await tx`
    SELECT count(*)::int AS live FROM bookings
    WHERE customer_id = ${customerId} AND status = 'pending' AND expires_at > now()`;
  if (live >= MAX_LIVE_HOLDS_PER_EMAIL) throw new HoldCapError('email');
  if (!ip) return;
  const [{ recent }] = await tx`
    SELECT count(*)::int AS recent FROM bookings
    WHERE client_ip = ${ip} AND created_at > now() - interval '1 hour'`;
  if (recent >= MAX_HOLDS_PER_IP_PER_HOUR) throw new HoldCapError('ip');
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
    // so their own previous hold doesn't block them; the token proves the
    // hold is theirs
    replaceBookingId, replaceToken,
    // anti-spam, mirroring the contact form
    company, elapsedMs,
  } = body || {};

  if (company) return bad('Invalid request'); // honeypot
  // The form always sends elapsedMs; a request without it did not come from the form.
  if (!Number.isFinite(elapsedMs) || elapsedMs < 2000) return bad('Please take a moment and try again');

  if (!tourSlug || !pricingOptionId || !date || !time) return bad('Missing booking details');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return bad('Invalid date or time');
  if (date > horizonDate()) {
    return bad('Online booking is open up to a year ahead. Call (805) 722-2282 for dates further out.');
  }
  const ip = clientIp(request);
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
    if (
      typeof replaceBookingId === 'string' && /^[0-9a-f-]{36}$/.test(replaceBookingId)
      && typeof replaceToken === 'string' && /^[0-9a-f]{32}$/.test(replaceToken)
    ) {
      // Only the holder's own unpaid pending hold can be replaced; harmless if bogus.
      await sql`
        UPDATE bookings SET status = 'cancelled'
        WHERE id = ${replaceBookingId} AND confirmation_token = ${replaceToken} AND status = 'pending'`;
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

    // Advertised price (base + 6% fee). Sales tax is currently disabled
    // (TAX_RATE = 0 in lib/pricing.js), so this resolves to 0 and the total is
    // simply the advertised price. Kept in the math so re-enabling tax is a
    // one-line change rather than a rewrite of the fee logic below.
    const taxCents = taxFromBase(option.base_cents);
    const totalCents = option.display_cents + taxCents;
    const giftCardCents = card ? Math.min(card.balance_cents, totalCents) : 0;
    const chargeCents = totalCents - giftCardCents;
    // Platform fee = the 6% built into the advertised price — never a cut of
    // the tax, which passes through to the operator in full. When a gift card
    // covers most of the booking, the fee yields to the tax: the operator has
    // to remit it, so the remaining charge pays the tax before the platform.
    const applicationFee = Math.max(
      0,
      Math.min(option.display_cents - option.base_cents, chargeCents - taxCents)
    );

    // 4. Insert the pending hold (+ customer) in one transaction.
    let booking;
    try {
      booking = await withTransaction(async (tx) => {
        // Taken before the customer row lock so every request locks in the same order.
        if (ip) await tx`SELECT pg_advisory_xact_lock(hashtext(${ip}))`;
        const customerId = await upsertCustomer(tx, {
          name: cleanName, email: cleanEmail, phone: cleanPhone,
        });
        await enforceHoldCaps(tx, customerId, ip);
        const rows = await tx`
          INSERT INTO bookings (
            tour_id, pricing_option_id, customer_id, party_size,
            trip_start, trip_end, block_range, status, expires_at,
            base_cents, fee_cents, tax_cents, gift_card_cents, charged_cents, notes, client_ip
          ) VALUES (
            ${tour.id}, ${option.id}, ${customerId}, ${party},
            ${tripStart.toISOString()}, ${tripEnd.toISOString()},
            tstzrange(${tripStart.toISOString()}, ${new Date(tripEnd.getTime() + BUFFER_MIN * 60000).toISOString()}),
            'pending', now() + (${HOLD_MINUTES} * interval '1 minute'),
            ${option.base_cents}, ${applicationFee}, ${taxCents}, ${giftCardCents}, ${chargeCents}, ${cleanNotes || null}, ${ip}
          )
          RETURNING id, confirmation_token, expires_at`;
        return rows[0];
      });
    } catch (err) {
      if (err?.code === EXCLUSION_VIOLATION) {
        return bad('That time was just taken. Please pick another slot.', 409);
      }
      if (err instanceof HoldCapError) {
        return bad('Too many booking attempts right now. Call (805) 722-2282 and we will hold a time for you.', 429);
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
      after(() => syncContact(bookingContact(details)));
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
      // Drives the countdown on the payment step; the row's clock, not the browser's.
      expiresAt: new Date(booking.expires_at).toISOString(),
    });
  } catch (err) {
    console.error('[checkout]', err);
    return bad('Something went wrong. Please try again or call (805) 722-2282.', 500);
  }
}

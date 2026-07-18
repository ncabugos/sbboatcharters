import { NextResponse } from 'next/server';
import { sql, withTransaction } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';
import { ptToUtc, BUFFER_MIN } from '@/lib/availability';
import { sendCaptainNotification, sendBookingConfirmation } from '@/lib/email';
import { loadBookingDetails } from '@/lib/bookings';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const EXCLUSION_VIOLATION = '23P01';

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const rows = await sql`
    SELECT b.id, b.trip_start, b.trip_end, b.party_size, b.status, b.source,
           b.charged_cents, b.gift_card_cents, b.notes, b.stripe_payment_intent_id,
           t.name AS tour_name, p.label AS option_label,
           c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM bookings b
    JOIN tours t ON t.id = b.tour_id
    JOIN pricing_options p ON p.id = b.pricing_option_id
    LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.trip_start > now() - interval '1 day'
      AND b.status IN ('pending','confirmed','cancelled')
      AND (b.status <> 'pending' OR b.expires_at > now())
    ORDER BY b.trip_start
    LIMIT 200`;
  return NextResponse.json({ bookings: rows });
}

// Manual booking (phone bookings) — payment handled off-platform.
export async function POST(request) {
  if (!(await isAdminRequest())) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { tourId, pricingOptionId, date, time, partySize, name, email, phone, notes, sendEmails } = body || {};
  if (!tourId || !pricingOptionId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) {
    return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
  }

  const options = await sql`
    SELECT * FROM pricing_options WHERE id = ${Number(pricingOptionId)} AND tour_id = ${Number(tourId)}`;
  const option = options[0];
  if (!option) return NextResponse.json({ error: 'Unknown pricing option' }, { status: 400 });

  const tripStart = ptToUtc(date, time);
  const tripEnd = new Date(tripStart.getTime() + option.duration_min * 60000);
  const blockEnd = new Date(tripEnd.getTime() + BUFFER_MIN * 60000);

  try {
    const booking = await withTransaction(async (tx) => {
      let customerId = null;
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (cleanEmail) {
        const rows = await tx`
          INSERT INTO customers (name, email, phone)
          VALUES (${String(name || 'Phone booking').trim()}, ${cleanEmail}, ${String(phone || '').trim() || null})
          ON CONFLICT ((lower(email)))
          DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(EXCLUDED.phone, customers.phone)
          RETURNING id`;
        customerId = rows[0].id;
      }
      const rows = await tx`
        INSERT INTO bookings (
          tour_id, pricing_option_id, customer_id, party_size,
          trip_start, trip_end, block_range, status,
          base_cents, fee_cents, charged_cents, source, notes
        ) VALUES (
          ${Number(tourId)}, ${option.id}, ${customerId}, ${Math.max(1, Number(partySize) || 1)},
          ${tripStart.toISOString()}, ${tripEnd.toISOString()},
          tstzrange(${tripStart.toISOString()}, ${blockEnd.toISOString()}),
          'confirmed', ${option.base_cents}, 0, 0, 'admin',
          ${String(notes || '').slice(0, 1000) || 'Booked by phone'}
        )
        RETURNING id, confirmation_token`;
      return rows[0];
    });

    if (sendEmails) {
      const details = await loadBookingDetails(booking.id);
      if (details?.customer_email) await sendBookingConfirmation(details);
      await sendCaptainNotification(details || { id: booking.id });
    }
    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (err) {
    if (err?.code === EXCLUSION_VIOLATION) {
      return NextResponse.json({ error: 'That time overlaps an existing booking.' }, { status: 409 });
    }
    console.error('[admin booking]', err);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// Cancel: frees the slot instantly (drops out of the exclusion predicate).
// Refunds stay manual in the operator's Stripe dashboard.
export async function PATCH(request) {
  if (!(await isAdminRequest())) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { bookingId, action } = body || {};
  if (!bookingId || action !== 'cancel') {
    return NextResponse.json({ error: 'bookingId and action=cancel required' }, { status: 400 });
  }
  const rows = await sql`
    UPDATE bookings SET status = 'cancelled'
    WHERE id = ${bookingId} AND status IN ('pending','confirmed')
    RETURNING id, stripe_payment_intent_id, charged_cents`;
  if (rows.length === 0) return NextResponse.json({ error: 'Booking not found or already cancelled' }, { status: 404 });
  return NextResponse.json({
    ok: true,
    note: rows[0].charged_cents > 0
      ? 'Slot freed. Issue any refund from the Stripe dashboard.'
      : 'Slot freed.',
  });
}

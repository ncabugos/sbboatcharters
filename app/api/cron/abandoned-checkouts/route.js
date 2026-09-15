import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { loadBookingDetails } from '@/lib/bookings';
import { sendAbandonedCheckout } from '@/lib/email';
import { getStripe, onConnected, stripeConfigured } from '@/lib/stripe';

// Scheduled from vercel.json every 15 minutes. The registered path MUST keep its
// trailing slash (see the note in ../review-requests/route.js): without it Vercel
// gets a 308, doesn't follow it, and the job silently never runs.
export const dynamic = 'force-dynamic';

// Checkout holds last 30 minutes, so an hour after starting checkout the guest
// has been gone for at least half an hour. With a 15-minute schedule the email
// lands 60 to 75 minutes after they left the payment step.
const MIN_AGE_MINUTES = 60;
// Upper bound: a missed run still catches people, but the first deploy doesn't
// mail everyone who ever abandoned a checkout.
const MAX_AGE_HOURS = 24;
// A trip leaving this soon is usually past the tour's booking notice anyway.
const MIN_LEAD_HOURS = 24;
// At most one reminder per person in this window, however many carts they leave.
const COOLDOWN_DAYS = 30;

// Stripe states in which money is moving or has moved. The webhook confirms a
// late payment on an expired hold, and that can land after this cron claims it.
const PAYING = new Set(['succeeded', 'processing', 'requires_capture']);

async function paymentInFlight(intentId) {
  if (!intentId || !stripeConfigured()) return false;
  const intent = await getStripe().paymentIntents.retrieve(intentId, {}, onConnected());
  return PAYING.has(intent.status);
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: 'RESEND_API_KEY not set', sent: 0 });
  }

  try {
    // Same lazy sweep /api/checkout runs; without traffic, stale holds stay 'pending'.
    await sql`
      UPDATE bookings SET status = 'expired'
      WHERE status = 'pending' AND expires_at < now()`;

    // Only a customer's most recent booking counts. If they came back and paid,
    // or restarted checkout (the old hold becomes 'cancelled' and a newer row
    // exists), the older abandoned row is skipped. Claimed before sending so a
    // duplicate cron invocation can't email anyone twice.
    const claimed = await sql`
      UPDATE bookings SET abandon_email_sent_at = now()
      WHERE id IN (
        SELECT b.id FROM bookings b
        JOIN customers c ON c.id = b.customer_id
        WHERE b.status = 'expired'
          AND b.source = 'web'
          AND b.abandon_email_sent_at IS NULL
          AND b.created_at < now() - (${MIN_AGE_MINUTES} * interval '1 minute')
          AND b.created_at > now() - (${MAX_AGE_HOURS} * interval '1 hour')
          AND b.trip_start > now() + (${MIN_LEAD_HOURS} * interval '1 hour')
          AND c.marketing_opt_out_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM bookings later
            WHERE later.customer_id = b.customer_id AND later.created_at > b.created_at
          )
          AND NOT EXISTS (
            SELECT 1 FROM bookings sent
            WHERE sent.customer_id = b.customer_id
              AND sent.abandon_email_sent_at > now() - (${COOLDOWN_DAYS} * interval '1 day')
          )
        FOR UPDATE OF b SKIP LOCKED
      )
      RETURNING id`;

    let sent = 0;
    let skipped = 0;
    const failed = [];
    for (const { id } of claimed) {
      const booking = await loadBookingDetails(id);
      try {
        // Leave the claim stamped: a paying guest must never get this email, and
        // retrying on the next run would only re-check the same intent.
        if (!booking?.customer_email || await paymentInFlight(booking.stripe_payment_intent_id)) {
          skipped += 1;
          continue;
        }
        if (await sendAbandonedCheckout(booking)) {
          sent += 1;
          continue;
        }
      } catch (err) {
        console.error('[cron/abandoned-checkouts] error, releasing', id, err);
      }
      await sql`UPDATE bookings SET abandon_email_sent_at = NULL WHERE id = ${id}`;
      failed.push(id);
    }

    console.log(`[cron/abandoned-checkouts] claimed ${claimed.length}, sent ${sent}, skipped ${skipped}, failed ${failed.length}`);
    return NextResponse.json({ claimed: claimed.length, sent, skipped, failed: failed.length });
  } catch (err) {
    console.error('[cron/abandoned-checkouts]', err);
    return NextResponse.json({ error: 'Cron run failed' }, { status: 500 });
  }
}

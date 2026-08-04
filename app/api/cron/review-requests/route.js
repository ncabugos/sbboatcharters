import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { loadBookingDetails } from '@/lib/bookings';
import { sendReviewRequest } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Only trips that finished at least this long ago are eligible, so a guest who
// stepped off the boat this morning isn't asked for a review the same day.
const MIN_AGE_HOURS = 12;
// Upper bound does double duty: it stops a missed run from silently dropping
// anyone, and it stops the very first deploy from mailing every past customer.
const MAX_AGE_DAYS = 7;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!process.env.GOOGLE_REVIEW_URL) {
    // Not an error — the feature simply isn't switched on yet.
    return NextResponse.json({ skipped: 'GOOGLE_REVIEW_URL not set', sent: 0 });
  }

  try {
    // Claim rows BEFORE sending. Vercel states cron delivery can invoke the same
    // scheduled run more than once, and a duplicate "thanks for coming out"
    // email is worse than a missed one. Stamping first means a second
    // invocation finds nothing to claim. SKIP LOCKED keeps two overlapping runs
    // from blocking on each other.
    const claimed = await sql`
      UPDATE bookings SET review_email_sent_at = now()
      WHERE id IN (
        SELECT id FROM bookings
        WHERE status = 'confirmed'
          AND review_email_sent_at IS NULL
          AND trip_end < now() - (${MIN_AGE_HOURS} * interval '1 hour')
          AND trip_end > now() - (${MAX_AGE_DAYS} * interval '1 day')
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id`;

    let sent = 0;
    const failed = [];
    for (const { id } of claimed) {
      const booking = await loadBookingDetails(id);
      if (!booking?.customer_email) {
        // Manual/phone bookings may have no email; release so it isn't retried.
        await sql`UPDATE bookings SET review_email_sent_at = NULL WHERE id = ${id}`;
        continue;
      }
      try {
        await sendReviewRequest(booking);
        sent += 1;
      } catch (err) {
        console.error('[cron/review-requests] send failed, releasing', id, err);
        await sql`UPDATE bookings SET review_email_sent_at = NULL WHERE id = ${id}`;
        failed.push(id);
      }
    }

    console.log(`[cron/review-requests] claimed ${claimed.length}, sent ${sent}`);
    return NextResponse.json({ claimed: claimed.length, sent, failed: failed.length });
  } catch (err) {
    console.error('[cron/review-requests]', err);
    return NextResponse.json({ error: 'Cron run failed' }, { status: 500 });
  }
}

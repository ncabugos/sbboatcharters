import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST only. Mail providers' link scanners follow every GET in an email, so a
// GET that unsubscribed would opt people out before they ever opened it.
//
// Two callers, both sending a form-encoded body:
//   - Gmail/Apple one-click (RFC 8058): body "List-Unsubscribe=One-Click", wants a 200
//   - the button on /unsubscribe/: wants to land back on that page
//
// `t` is the booking's confirmation_token, a random 32-hex value already used as
// the booking's private link, so it proves the request came from that email.
export async function POST(request) {
  const token = new URL(request.url).searchParams.get('t') || '';
  if (!/^[0-9a-f]{32}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE customers SET marketing_opt_out_at = COALESCE(marketing_opt_out_at, now())
    WHERE id = (SELECT customer_id FROM bookings WHERE confirmation_token = ${token})
    RETURNING id`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  }

  const body = await request.text().catch(() => '');
  if (body.includes('List-Unsubscribe=One-Click')) {
    return NextResponse.json({ unsubscribed: true });
  }
  return NextResponse.redirect(new URL(`/unsubscribe/?t=${token}&done=1`, request.url), 303);
}

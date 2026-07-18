import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';
import { ptToUtc } from '@/lib/availability';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const rows = await sql`
    SELECT id, starts_at, ends_at, reason FROM blackout_dates
    WHERE ends_at > now() ORDER BY starts_at`;
  return NextResponse.json({ blackouts: rows });
}

export async function POST(request) {
  if (!(await isAdminRequest())) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Full-day blocks in Pacific time: startDate..endDate inclusive.
  const { startDate, endDate, reason } = body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || startDate)) {
    return NextResponse.json({ error: 'Dates required (YYYY-MM-DD)' }, { status: 400 });
  }
  const startsAt = ptToUtc(startDate, '00:00');
  const endsAt = new Date(ptToUtc(endDate || startDate, '23:59').getTime() + 60000);
  if (endsAt <= startsAt) {
    return NextResponse.json({ error: 'End date must not be before start date' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO blackout_dates (starts_at, ends_at, reason)
    VALUES (${startsAt.toISOString()}, ${endsAt.toISOString()}, ${String(reason || '').slice(0, 200) || null})
    RETURNING id, starts_at, ends_at, reason`;
  return NextResponse.json({ blackout: rows[0] });
}

export async function DELETE(request) {
  if (!(await isAdminRequest())) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await sql`DELETE FROM blackout_dates WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

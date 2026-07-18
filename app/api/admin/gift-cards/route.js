import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const rows = await sql`
    SELECT id, code, initial_cents, balance_cents, status,
           purchaser_email, recipient_email, created_at
    FROM gift_cards
    WHERE status <> 'pending_payment'
    ORDER BY created_at DESC
    LIMIT 200`;
  return NextResponse.json({ giftCards: rows });
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { id, action } = body || {};
  if (!Number.isInteger(Number(id)) || !['disable', 'enable'].includes(action)) {
    return NextResponse.json({ error: 'id and action (disable|enable) required' }, { status: 400 });
  }
  const next = action === 'disable' ? 'disabled' : 'active';
  const guard = action === 'disable' ? 'active' : 'disabled';
  const rows = await sql`
    UPDATE gift_cards SET status = ${next}
    WHERE id = ${Number(id)} AND status = ${guard}
    RETURNING id, status`;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found or wrong state' }, { status: 404 });
  return NextResponse.json({ ok: true, status: rows[0].status });
}

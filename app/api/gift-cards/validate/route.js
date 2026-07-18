import { NextResponse } from 'next/server';
import { findActiveCard } from '@/lib/giftCards';

export const dynamic = 'force-dynamic';

// Best-effort per-IP throttle (resets on redeploy; DB constraint + huge code
// space are the real protections against brute force).
const attempts = new Map();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 10;

function throttled(ip) {
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  attempts.set(ip, entry);
  if (attempts.size > 5000) attempts.clear();
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const card = await findActiveCard(body?.code);
  if (!card) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, balanceCents: card.balance_cents });
}

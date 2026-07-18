import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'sbbc_admin';
const SESSION_HOURS = 12;

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET || '')
    .update(payload)
    .digest('hex');
}

export function createSessionValue() {
  const expires = Date.now() + SESSION_HOURS * 3600000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value) {
  if (!value || !process.env.ADMIN_SESSION_SECRET) return false;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(payload) > Date.now();
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still compare something constant-time-ish to avoid length oracle.
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export async function isAdminRequest() {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE)?.value);
}

export const ADMIN_COOKIE = COOKIE;

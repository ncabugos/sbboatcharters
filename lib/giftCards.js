import crypto from 'crypto';
import { sql } from './db';

// Crypto-random code, alphabet excludes 0/O/1/I. Space ~32^8 ≈ 10^12.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode() {
  const bytes = crypto.randomBytes(8);
  let raw = '';
  for (const b of bytes) raw += ALPHABET[b % ALPHABET.length];
  return `SBBC-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function normalizeCode(input) {
  const cleaned = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned.startsWith('SBBC') || cleaned.length !== 12) return null;
  return `SBBC-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
}

export async function findActiveCard(codeInput) {
  const code = normalizeCode(codeInput);
  if (!code) return null;
  const rows = await sql`
    SELECT id, code, balance_cents FROM gift_cards
    WHERE code = ${code} AND status = 'active' AND balance_cents > 0`;
  return rows[0] || null;
}

// Transactional redemption: decrement guarded by balance check, so two
// concurrent checkouts can never overspend a card. Call inside withTransaction.
export async function redeemWithinTx(tx, giftCardId, bookingId, amountCents) {
  const updated = await tx`
    UPDATE gift_cards
    SET balance_cents = balance_cents - ${amountCents},
        status = CASE WHEN balance_cents - ${amountCents} = 0 THEN 'depleted' ELSE status END
    WHERE id = ${giftCardId} AND status IN ('active','depleted') AND balance_cents >= ${amountCents}
    RETURNING id`;
  if (updated.length === 0) throw new Error('gift_card_insufficient');
  await tx`
    INSERT INTO gift_card_redemptions (gift_card_id, booking_id, amount_cents)
    VALUES (${giftCardId}, ${bookingId}, ${amountCents})`;
}

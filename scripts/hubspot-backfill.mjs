#!/usr/bin/env node
/**
 * One-time backfill of past customers into HubSpot.
 *
 * Reads every confirmed booking and every paid gift card from the database,
 * collapses them to one contact per email (keeping the latest trip), and
 * upserts them in batches of 100. Re-running is harmless: upserts are
 * idempotent and only ever move a contact forward.
 *
 * Usage:
 *   npm run hubspot:backfill -- --dry-run     # print what would be sent
 *   npm run hubspot:backfill
 *
 * Database resolution is scripts/catalog-db.js (explicit DATABASE_URL beats
 * the env files; NEON_DATABASE_URL in .env.local means production). The
 * target host is printed before anything connects. To rehearse against the
 * local docker catalog:
 *   DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)" npm run hubspot:backfill -- --dry-run
 */
import catalogDb from './catalog-db.js';
import { loadHubspotToken } from './hubspot-env.mjs';

const dryRun = process.argv.includes('--dry-run');
loadHubspotToken();
const { contactProperties, upsertContacts, bookingContact, giftCardContacts } =
  await import('../lib/hubspot.mjs');

const { pool, client } = await catalogDb.connect();
try {
  const { rows: bookings } = await pool.query(`
    SELECT c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
           t.name AS tour_name, b.trip_start
    FROM bookings b
    JOIN tours t ON t.id = b.tour_id
    JOIN customers c ON c.id = b.customer_id
    WHERE b.status = 'confirmed'
    ORDER BY b.trip_start ASC`);
  const { rows: cards } = await pool.query(`
    SELECT purchaser_name, purchaser_email, recipient_name, recipient_email
    FROM gift_cards
    WHERE status IN ('active', 'depleted')
    ORDER BY created_at ASC`);

  // Later rows overwrite earlier ones, so a repeat customer ends up with their
  // most recent tour and trip date; a booking beats a gift card for the same email.
  const byEmail = new Map();
  const add = (input) => {
    const props = contactProperties(input);
    if (props) byEmail.set(props.email, { ...(byEmail.get(props.email) || {}), ...props });
  };
  for (const card of cards) giftCardContacts(card).forEach(add);
  for (const b of bookings) add(bookingContact(b));

  const all = [...byEmail.values()];
  console.log(`${bookings.length} confirmed bookings, ${cards.length} paid gift cards -> ${all.length} contacts`);
  if (dryRun) {
    for (const p of all) console.log(' ', p.email, '|', p.sbbc_source, '|', p.sbbc_last_tour || '-', '|', p.sbbc_last_trip_date || '-');
    console.log('Dry run: nothing sent.');
  } else {
    for (let i = 0; i < all.length; i += 100) {
      const batch = all.slice(i, i + 100);
      const out = await upsertContacts(batch);
      console.log(`  sent ${batch.length} (${out.results?.length ?? '?'} results)`);
    }
    console.log('Done.');
  }
} finally {
  client.release();
  await pool.end();
}

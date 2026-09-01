#!/usr/bin/env node
/**
 * Cap Spear Fishing at 4 guests in the catalog database.
 *
 * The marketing page has always said "Up to 4 passengers", but tours.max_party
 * for spearfishing was seeded at the boat's 6, so the booking page offered
 * "Guests (max 6)" and would have accepted a party of five or six. The booking
 * flow, the availability API and the admin manual-booking form all read
 * max_party live, so this one column is the whole fix.
 *
 * Capacity lives in the database, not the code — db/seed.sql only affects a
 * fresh install (see docs/BOOKING-SETUP.md). This is the production half of
 * the seed.sql change made alongside it.
 *
 * Usage — no arguments, just:
 *   node scripts/apply-spearfishing-capacity.js
 *
 * The connection string is read from the first of these that holds a real
 * postgres URL: the DATABASE_URL env var, then .env.production.local, then
 * .env.local (see scripts/catalog-db.js). .env.local's DATABASE_URL is the
 * local docker catalog, so with nothing else set this rehearses locally; put
 * the Neon string in .env.local as NEON_DATABASE_URL to run it for real.
 *
 * Safe to re-run: sets an explicit literal, so a second run is a no-op.
 */
const { connect } = require('./catalog-db');

const SLUG = 'spearfishing';
const MAX_PARTY = 4;

async function show(client, when) {
  const { rows } = await client.query('SELECT name, max_party FROM tours WHERE slug = $1', [SLUG]);
  if (rows.length !== 1) throw new Error(`Expected 1 tour with slug ${SLUG}, found ${rows.length}`);
  console.log(`\n${when}: ${rows[0].name} — max_party ${rows[0].max_party}`);
  return rows[0];
}

(async () => {
  const { pool, client } = await connect();
  try {
    await show(client, 'BEFORE');

    await client.query('BEGIN');
    const { rowCount } = await client.query(
      'UPDATE tours SET max_party = $1 WHERE slug = $2',
      [MAX_PARTY, SLUG]
    );
    if (rowCount !== 1) {
      throw new Error(`Expected to update 1 row, updated ${rowCount} — rolling back`);
    }
    await client.query('COMMIT');

    const after = await show(client, 'AFTER');
    if (after.max_party !== MAX_PARTY) throw new Error('max_party did not take');
    console.log('\nCommitted. The booking page reads this live — no redeploy needed.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\nFailed, nothing changed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();

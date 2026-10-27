#!/usr/bin/env node
/**
 * Add bookings.client_ip so /api/checkout can cap holds per IP address.
 *
 * Run this BEFORE deploying the code that writes the column; until it runs,
 * the new checkout INSERT fails and nobody can start a booking.
 *
 * Usage, no arguments (connection resolution is scripts/catalog-db.js):
 *   node scripts/apply-checkout-hardening.js
 * Rehearse on the local docker catalog first:
 *   DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)" node scripts/apply-checkout-hardening.js
 *
 * Safe to re-run: IF NOT EXISTS.
 */
const { connect } = require('./catalog-db');

async function hasColumn(client) {
  const { rows } = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'client_ip'`);
  return rows.length > 0;
}

(async () => {
  const { pool, client } = await connect();
  try {
    console.log(`\nBEFORE: bookings.client_ip ${(await hasColumn(client)) ? 'present' : 'missing'}`);
    await client.query('BEGIN');
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_ip text`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS bookings_ip_idx ON bookings (client_ip, created_at)`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id)`);
    await client.query('COMMIT');
    if (!(await hasColumn(client))) throw new Error('column did not take');
    console.log('AFTER:  bookings.client_ip present, indexes in place');
    console.log('\nCommitted.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\nFailed, nothing changed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();

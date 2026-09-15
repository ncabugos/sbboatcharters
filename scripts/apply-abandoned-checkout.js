#!/usr/bin/env node
/**
 * Add the two columns the abandoned-checkout email needs:
 *   bookings.abandon_email_sent_at   claimed by /api/cron/abandoned-checkouts/
 *   customers.marketing_opt_out_at   set by the unsubscribe link
 *
 * Run this BEFORE deploying the code that reads them. The review-request cron
 * also checks marketing_opt_out_at, so deploying first would break review
 * emails until this runs. Both columns are nullable with no default, so running
 * it early is harmless to the code already live.
 *
 * Usage, no arguments (connection resolution is scripts/catalog-db.js):
 *   node scripts/apply-abandoned-checkout.js
 * Rehearse on the local docker catalog first:
 *   DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)" node scripts/apply-abandoned-checkout.js
 *
 * Safe to re-run: IF NOT EXISTS.
 */
const { connect } = require('./catalog-db');

const COLUMNS = [
  ['bookings', 'abandon_email_sent_at'],
  ['customers', 'marketing_opt_out_at'],
];

async function show(client, when) {
  const { rows } = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE (table_name, column_name) IN (('bookings','abandon_email_sent_at'), ('customers','marketing_opt_out_at'))`
  );
  console.log(`\n${when}:`);
  for (const [table, column] of COLUMNS) {
    const present = rows.some((r) => r.table_name === table && r.column_name === column);
    console.log(`  ${`${table}.${column}`.padEnd(34)} ${present ? 'present' : 'missing'}`);
  }
  return rows.length;
}

(async () => {
  const { pool, client } = await connect();
  try {
    await show(client, 'BEFORE');
    await client.query('BEGIN');
    await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS abandon_email_sent_at timestamptz');
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_opt_out_at timestamptz');
    await client.query('COMMIT');
    const present = await show(client, 'AFTER');
    if (present !== COLUMNS.length) throw new Error('a column did not take');
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

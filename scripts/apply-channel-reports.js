#!/usr/bin/env node
/**
 * Create the channel_reports table behind /report/ and /admin/reports.
 *
 * Run this BEFORE deploying the code that reads it. Until it runs, /report/
 * shows its empty state and the admin editor cannot save; nothing else on the
 * site touches the table, so running it early is harmless.
 *
 * Usage, no arguments (connection resolution is scripts/catalog-db.js):
 *   node scripts/apply-channel-reports.js
 * Rehearse on the local docker catalog first:
 *   DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)" node scripts/apply-channel-reports.js
 *
 * Safe to re-run: IF NOT EXISTS.
 */
const { connect } = require('./catalog-db');

async function exists(client) {
  const { rows } = await client.query(`SELECT to_regclass('public.channel_reports') AS t`);
  return Boolean(rows[0].t);
}

(async () => {
  const { pool, client } = await connect();
  try {
    console.log(`\nBEFORE: channel_reports ${(await exists(client)) ? 'present' : 'missing'}`);
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_reports (
        id           serial PRIMARY KEY,
        report_date  date UNIQUE NOT NULL,
        summary      text NOT NULL DEFAULT '',
        water_temp   text,
        wildlife     text,
        fishing      text,
        diving       text,
        outlook      text,
        open_dates   text,
        published_at timestamptz,
        created_at   timestamptz NOT NULL DEFAULT now(),
        updated_at   timestamptz NOT NULL DEFAULT now()
      )`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS channel_reports_published_idx
      ON channel_reports (report_date DESC) WHERE published_at IS NOT NULL`);
    await client.query('COMMIT');
    if (!(await exists(client))) throw new Error('table did not take');
    const { rows } = await client.query('SELECT count(*)::int AS n FROM channel_reports');
    console.log(`AFTER:  channel_reports present, ${rows[0].n} rows`);
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

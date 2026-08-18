#!/usr/bin/env node
/**
 * Apply the Full Day Island Cruise duration wording to the catalog database.
 *
 * Mirrors the db/seed.sql change in commit 0ada894: the 6h option is a 3/4 day
 * and the 8h option is a full day, and the tour description says so too. Prices,
 * durations and sort order are untouched.
 *
 * Prices and copy live in the database, not the code — editing seed.sql only
 * affects a fresh install (see docs/BOOKING-SETUP.md). This is the production
 * half of that change.
 *
 * Usage (get the connection string from Vercel → Storage → Neon → Connect):
 *   DATABASE_URL='postgresql://...' node scripts/apply-island-cruise-durations.js
 *
 * Safe to re-run: every statement sets an explicit literal value, so a second
 * run is a no-op rather than something that compounds.
 */
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    'Missing DATABASE_URL.\n\n' +
      'Vercel → Storage → your Neon database → Connect → copy the connection string, then:\n' +
      "  DATABASE_URL='postgresql://...' node scripts/apply-island-cruise-durations.js"
  );
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const SLUG = 'full-day-island-cruise';
const DESCRIPTION =
  'A private six-hour (3/4 day) or eight-hour (full day) excursion to Santa Cruz ' +
  'Island and the Channel Islands: sea caves, snorkeling, wildlife, and secluded ' +
  'anchorages — tailored just for you and up to five guests.';

async function show(client, when) {
  const { rows } = await client.query(
    `SELECT o.duration_min, o.label, o.display_cents
       FROM pricing_options o JOIN tours t ON t.id = o.tour_id
      WHERE t.slug = $1 ORDER BY o.sort_order`,
    [SLUG]
  );
  const [tour] = (
    await client.query('SELECT description FROM tours WHERE slug = $1', [SLUG])
  ).rows;
  console.log(`\n${when}:`);
  for (const r of rows) {
    console.log(
      `  ${String(r.duration_min).padStart(3)} min  $${r.display_cents / 100}  ${r.label}`
    );
  }
  console.log(`  description: ${tour.description}`);
  return rows.length;
}

(async () => {
  const client = await pool.connect();
  try {
    console.log(`Target: ${isLocal ? 'LOCAL Postgres' : 'REMOTE (Neon)'}`);
    const found = await show(client, 'BEFORE');
    if (found !== 2) {
      throw new Error(`Expected 2 pricing options for ${SLUG}, found ${found}`);
    }

    await client.query('BEGIN');
    const label = (durationMin, text) =>
      client.query(
        `UPDATE pricing_options o SET label = $1
           FROM tours t
          WHERE t.id = o.tour_id AND t.slug = $2 AND o.duration_min = $3`,
        [text, SLUG, durationMin]
      );

    const results = [
      await label(360, 'Six Hour Private Charter (3/4 Day)'),
      await label(480, 'Eight Hour Private Charter (Full Day)'),
      await client.query('UPDATE tours SET description = $1 WHERE slug = $2', [
        DESCRIPTION,
        SLUG,
      ]),
    ];
    const touched = results.reduce((n, r) => n + r.rowCount, 0);
    if (touched !== 3) {
      throw new Error(`Expected to update 3 rows, updated ${touched} — rolling back`);
    }
    await client.query('COMMIT');

    await show(client, 'AFTER');
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

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
 * Usage — no arguments, just:
 *   node scripts/apply-island-cruise-durations.js
 *
 * The connection string is read from the first of these that holds a real
 * postgres URL: the DATABASE_URL env var, then .env.production.local (what
 * `vercel env pull` writes), then .env.local. Putting it in a file rather than
 * on the command line avoids the shell mangling passwords that contain $, !,
 * or & — and .env* is gitignored, so it can't be committed by accident.
 *
 * Safe to re-run: every statement sets an explicit literal value, so a second
 * run is a no-op rather than something that compounds.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ROOT = path.join(__dirname, '..');
const ENV_FILES = ['.env.production.local', '.env.local'];
// Priority order, NOT file order. .env.local ships a localhost DATABASE_URL for
// dev, so a production string pasted into NEON_DATABASE_URL has to outrank it —
// otherwise this quietly edits the docker catalog and reports success.
const KEYS = ['NEON_DATABASE_URL', 'POSTGRES_URL', 'DATABASE_URL'];

// A usable value is a postgres URL — not blank, and not the placeholder from
// the instructions, which otherwise fails later as a baffling DNS error.
const usable = (v) => typeof v === 'string' && /^postgres(ql)?:\/\/.+@.+/.test(v.trim());

function parseEnvFile(full) {
  const found = {};
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*)$/);
    if (m && KEYS.includes(m[1])) found[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return found;
}

function fromEnvFiles() {
  for (const file of ENV_FILES) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const vars = parseEnvFile(full);
    for (const key of KEYS) {
      if (usable(vars[key])) return { value: vars[key], source: `${file} (${key})` };
    }
  }
  return null;
}

// An explicitly-passed DATABASE_URL that isn't a valid postgres URL is a typo,
// not a reason to look elsewhere. Falling back to .env.local here would quietly
// run against the local docker catalog while the operator believed they were
// updating production.
if (process.env.DATABASE_URL && !usable(process.env.DATABASE_URL)) {
  console.error(
    `DATABASE_URL is set but is not a valid postgres URL:\n\n  ${process.env.DATABASE_URL}\n\n` +
      'Expected postgresql://user:password@host/dbname. Refusing to fall back to\n' +
      'another connection string, so this cannot silently hit the wrong database.'
  );
  process.exit(1);
}

let connectionString = process.env.DATABASE_URL;
let source = 'DATABASE_URL env var';
if (!usable(connectionString)) {
  const found = fromEnvFiles();
  if (found) {
    connectionString = found.value;
    source = found.source;
  }
}

if (!usable(connectionString)) {
  console.error(
    'No usable Postgres connection string found.\n\n' +
      'Get the production one from Vercel → your project → Storage → the Neon\n' +
      'database → Connect, then paste it into .env.local on this line:\n\n' +
      '  NEON_DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require\n\n' +
      'Then re-run this script with no arguments. Paste the real string — a\n' +
      'placeholder like PASTE_NEON_CONNECTION_STRING_HERE is not a hostname.\n\n' +
      `Looked in: DATABASE_URL env var, ${ENV_FILES.join(', ')}`
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
  // Announce the target BEFORE connecting, so a connection failure still tells
  // you which database was attempted.
  console.log(`Target: ${isLocal ? 'LOCAL Postgres' : 'REMOTE'} — ${new URL(connectionString).host}`);
  console.log(`Source: ${source}`);

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error(
      `\nCould not connect: ${err.message}\n\n` +
        'Check the connection string was copied whole, including the ?sslmode=require\n' +
        'suffix, and that it is the one Vercel shows under Storage → Connect.'
    );
    await pool.end().catch(() => {});
    process.exit(1);
  }

  try {
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

/**
 * Shared connection resolution for the one-off catalog scripts.
 *
 * Extracted from scripts/apply-island-cruise-durations.js, which documents the
 * hazards each rule here exists to prevent:
 *  - keys are ranked by preference, never by file order, so a production string
 *    in NEON_DATABASE_URL beats the localhost DATABASE_URL above it in .env.local;
 *  - a value that is present but not a postgres URL (a typo, or Vercel's
 *    "[SENSITIVE]" redaction) is a hard stop, never a fallback;
 *  - the target host and the source of the string are printed BEFORE connecting.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ROOT = path.join(__dirname, '..');
const ENV_FILES = ['.env.production.local', '.env.local'];
const KEYS = ['NEON_DATABASE_URL', 'POSTGRES_URL', 'DATABASE_URL'];

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
      const value = vars[key];
      if (value === undefined || value === '') continue;
      if (usable(value)) return { value, source: `${file} (${key})` };
      const redacted = /^\[SENSITIVE\]$/.test(value);
      console.error(
        `${file} sets ${key} to ${redacted ? 'the placeholder [SENSITIVE]' : `"${value}"`}, ` +
          'which is not a postgres URL.\n' +
          (redacted
            ? '\nVercel redacts variables marked sensitive, so `vercel env pull` cannot\n' +
              'retrieve this one. Copy the connection string from Vercel → Storage →\n' +
              'your Neon database → Connect, and paste it into .env.local as:\n\n' +
              '  NEON_DATABASE_URL=postgresql://...\n'
            : '\nFix or remove that line.\n') +
          '\nStopping rather than falling back, so this cannot hit the wrong database.'
      );
      process.exit(1);
    }
  }
  return null;
}

function resolveConnectionString() {
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
    if (found) ({ value: connectionString, source } = found);
  }
  if (!usable(connectionString)) {
    console.error(
      'No usable Postgres connection string found.\n\n' +
        'Get the production one from Vercel → your project → Storage → the Neon\n' +
        'database → Connect, then paste it into .env.local on this line:\n\n' +
        '  NEON_DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require\n\n' +
        `Looked in: DATABASE_URL env var, ${ENV_FILES.join(', ')}`
    );
    process.exit(1);
  }
  return { connectionString, source };
}

// Resolve, announce the target, connect. Returns { pool, client, isLocal }.
async function connect() {
  const { connectionString, source } = resolveConnectionString();
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  console.log(`Target: ${isLocal ? 'LOCAL Postgres' : 'REMOTE'} — ${new URL(connectionString).host}`);
  console.log(`Source: ${source}`);
  const pool = new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
  try {
    const client = await pool.connect();
    return { pool, client, isLocal };
  } catch (err) {
    console.error(
      `\nCould not connect: ${err.message}\n\n` +
        'Check the connection string was copied whole, including the ?sslmode=require\n' +
        'suffix, and that it is the one Vercel shows under Storage → Connect.'
    );
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

module.exports = { connect };

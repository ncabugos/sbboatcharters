import { Pool } from 'pg';

// Works against local Postgres (dev) and Neon (production) via DATABASE_URL.
// Neon requires SSL; local docker does not.
const globalForDb = globalThis;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  const needsSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    max: 5,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
  });
}

export function getPool() {
  if (!globalForDb.__sbbcPool) globalForDb.__sbbcPool = createPool();
  return globalForDb.__sbbcPool;
}

// Tagged template: sql`SELECT * FROM tours WHERE slug = ${slug}` → parameterized query.
export async function sql(strings, ...values) {
  const text = strings.reduce((acc, s, i) => acc + '$' + i + s);
  const { rows } = await getPool().query(text, values);
  return rows;
}

// Run a callback inside a transaction with a dedicated client.
// The callback receives a `tx` tagged template bound to that client.
export async function withTransaction(fn) {
  const client = await getPool().connect();
  const tx = async (strings, ...values) => {
    const text = strings.reduce((acc, s, i) => acc + '$' + i + s);
    const { rows } = await client.query(text, values);
    return rows;
  };
  try {
    await client.query('BEGIN');
    const result = await fn(tx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

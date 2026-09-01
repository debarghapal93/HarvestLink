/**
 * database.js — PostgreSQL pool via `pg`.
 * Connects to Supabase (or any Postgres) using the DATABASE_URL env var.
 * Exposes a singleton pool for use across all route files.
 */
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('[DB] DATABASE_URL is not set. Add it to your .env file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for Supabase's TLS setup
  ssl: { rejectUnauthorized: false },
  // Connection pool tuning
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Log pool errors to avoid unhandled rejections crashing the process
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool client error:', err.message);
});

/**
 * getPool() — returns the singleton pg.Pool.
 * All route files import and call this instead of `getDb()`.
 */
export function getPool() {
  return pool;
}

/**
 * connectDb() — test the connection on startup and log success.
 * Call this once in server/index.js at boot.
 */
export async function connectDb() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT NOW() AS now');
    console.log(`[DB] ✓ Connected to Supabase PostgreSQL — server time: ${rows[0].now}`);
  } finally {
    client.release();
  }
}

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 0
});

// Test query without killing process on transient errors
export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
}

export default pool;

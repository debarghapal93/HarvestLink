import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import { getPool, connectDb }    from './db/database.js';
import authRouter                from './routes/auth.js';
import listingsRouter            from './routes/listings.js';
import demandRouter              from './routes/demand.js';
import { authenticateToken }     from './middleware/auth.js';

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ───────────────────────────────────────── */
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Health check (public) ────────────────────────────── */
app.get('/api/health', async (_req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT COUNT(id)::int AS n FROM produce_listings');
    res.json({ status: 'ok', listings: rows[0].n, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/* ── Public Routes ────────────────────────────────────── */
app.use('/api/auth', authRouter);

/* ── Protected Routes (JWT required) ─────────────────── */
app.use('/api/listings', authenticateToken, listingsRouter);
app.use('/api/demand',   authenticateToken, demandRouter);

/* ── 404 Fallback ─────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

/* ── Global Error Handling Middleware ──────────────────── */
app.use((err, req, res, _next) => {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.stack || err.message || err);

  // Surface PostgreSQL-specific errors cleanly
  if (err.code) {
    console.error(`[DB Error Code] ${err.code}:`, err.detail || '');
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { detail: err.detail, code: err.code }),
  });
});

/* ── Startup ──────────────────────────────────────────── */
async function start() {
  try {
    await connectDb();  // Verify Supabase connection before accepting traffic
    app.listen(PORT, () => {
      console.log(`
  ┌─────────────────────────────────────────────┐
  │  HarvestLink API  →  port ${PORT}              │
  │  DB: Supabase PostgreSQL (pg pool)          │
  │                                             │
  │  PUBLIC                                     │
  │  GET  /api/health                           │
  │  POST /api/auth/login                       │
  │  GET  /api/auth/me                          │
  │                                             │
  │  PROTECTED  (Bearer JWT required)           │
  │  GET  /api/listings/active                  │
  │  POST /api/listings                         │
  │  GET  /api/demand/active                    │
  │  POST /api/demand                           │
  └─────────────────────────────────────────────┘`);
    });
  } catch (err) {
    console.error('[Startup] Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
export default app;
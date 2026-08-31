import express from 'express';
import cors    from 'cors';
import { getDb }             from './db/database.js';
import authRouter            from './routes/auth.js';
import listingsRouter        from './routes/listings.js';
import demandRouter          from './routes/demand.js';
import { authenticateToken } from './middleware/auth.js';

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ───────────────────────────────────────── */
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Health check (public) ────────────────────────────── */
app.get('/api/health', (_req, res, next) => {
  try {
    const db = getDb();
    const { n } = db.prepare('SELECT COUNT(id) AS n FROM produce_listings').get();
    res.json({ status: 'ok', listings: n, timestamp: new Date().toISOString() });
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
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/* ── Startup ──────────────────────────────────────────── */
getDb();
app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────────┐
  │  HarvestLink API  →  port ${PORT}              │
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

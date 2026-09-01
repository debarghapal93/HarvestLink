import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/database.js';
import { JWT_SECRET, JWT_EXPIRY } from '../middleware/auth.js';

const router = Router();

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/* ───────────────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body:    { email, password }
   Returns: { token, user: { id, name, role, email } }
─────────────────────────────────────────────────────────────────────── */
router.post('/login', async (req, res, next) => {
  try {
    const email    = sanitizeString(req.body.email);
    const password = sanitizeString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }


    const { rows } = await pool.query(
      `SELECT id, name, role, email, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );
    const user = rows[0];

    if (!user) {
      // Timing-safe: still compare a dummy hash to prevent enumeration attacks
      await bcrypt.compare(password, '$2b$10$invalidhashforstringcomparisontiming');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = { id: user.id, name: user.name, role: user.role };
    const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, email: user.email },
    });

  } catch (err) {
    next(err);
  }
});

/* ───────────────────────────────────────────────────────────────────────
   GET /api/auth/me
   Requires: Authorization: Bearer <token>
   Returns the authenticated user's profile from the DB.
─────────────────────────────────────────────────────────────────────── */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT id, name, role, email, lat, lng FROM users WHERE id = $1 LIMIT 1`,
      [decoded.id]
    );
    const user = rows[0];

    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user });

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    next(err);
  }
});

export default router;

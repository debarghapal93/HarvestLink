import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.js';
import { JWT_SECRET, JWT_EXPIRY } from '../middleware/auth.js';

const router = Router();

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/* ───────────────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
   Returns: { token, user: { id, name, role } }
─────────────────────────────────────────────────────────────────────── */
router.post('/login', async (req, res, next) => {
  try {
    const email    = sanitizeString(req.body.email);
    const password = sanitizeString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db   = getDb();
    const user = db.prepare(`
      SELECT id, name, role, email, password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `).get(email);

    if (!user) {
      // Timing-safe: still compare a dummy hash to prevent timing attacks
      await bcrypt.compare(password, '$2b$10$invalidhashforstringcomparisontiming');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Sign JWT: embed id, name, role in payload
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
   Returns the currently authenticated user from their JWT.
   Requires: Authorization: Bearer <token>
─────────────────────────────────────────────────────────────────────── */
router.get('/me', (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db      = getDb();
    const user    = db.prepare(`
      SELECT id, name, role, email, location FROM users WHERE id = ? LIMIT 1
    `).get(decoded.id);

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

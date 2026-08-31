import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/* ───────────────────────────────────────────────────────────────────────
   POST /api/demand
   Accepts buyer requirements, sanitizes payload, inserts into DB.
─────────────────────────────────────────────────────────────────────── */
router.post('/', (req, res, next) => {
  try {
    const rawCrop       = sanitizeString(req.body.crop);
    const rawBuyerLabel = sanitizeString(req.body.buyer_label);
    const rawLocation   = sanitizeString(req.body.location);
    const rawDeadline   = sanitizeString(req.body.deadline);
    const buyerIdNum    = parseInt(req.body.buyer_id, 10) || 4;
    const qtyNum        = parseFloat(req.body.requested_qty);
    const targetPrice   = parseFloat(req.body.target_price);
    const isPriority    = req.body.is_priority ? 1 : 0;

    // ── Input Validation ──
    if (!rawCrop) {
      return res.status(400).json({ error: 'Validation Error: Crop name is required.' });
    }
    if (isNaN(qtyNum) || qtyNum <= 0 || !isFinite(qtyNum)) {
      return res.status(400).json({ error: 'Validation Error: requested_qty must be a positive finite number.' });
    }

    const db = getDb();

    // Pre-calculate matched_qty using targeted column projection
    const { matched } = db.prepare(`
      SELECT COALESCE(SUM(qty), 0) AS matched
      FROM produce_listings
      WHERE LOWER(crop) = LOWER(?) AND status != 'fulfilled'
    `).get(rawCrop);

    const initMatched = Math.min(matched || 0, qtyNum);
    const initStatus  = initMatched >= qtyNum ? 'ready' : 'matching';

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO demand_pool (buyer_id, buyer_label, crop, requested_qty, matched_qty, target_price, status, location, deadline, is_priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      buyerIdNum,
      rawBuyerLabel || 'Buyer',
      rawCrop,
      qtyNum,
      initMatched,
      !isNaN(targetPrice) && targetPrice > 0 ? targetPrice : null,
      initStatus,
      rawLocation || null,
      rawDeadline || null,
      isPriority
    );

    // Fetch inserted record with explicit column mapping
    const demand = db.prepare(`
      SELECT id, buyer_id, buyer_label AS buyerLabel, crop, requested_qty AS requestedQty,
             matched_qty AS matchedQty, target_price AS targetPrice, status, location,
             deadline AS time, is_priority AS isPriority, created_at
      FROM demand_pool
      WHERE id = ?
    `).get(lastInsertRowid);

    return res.status(201).json({
      success: true,
      demand: { ...demand, isPriority: demand.isPriority === 1 }
    });
  } catch (err) {
    next(err);
  }
});

/* ───────────────────────────────────────────────────────────────────────
   GET /api/demand/active
   Returns active demand pool with explicit column selection.
─────────────────────────────────────────────────────────────────────── */
router.get('/active', (_req, res, next) => {
  try {
    const db = getDb();
    const demands = db.prepare(`
      SELECT
        dp.id,
        dp.buyer_id,
        dp.buyer_label   AS buyerLabel,
        dp.crop,
        dp.requested_qty AS requestedQty,
        dp.matched_qty   AS matchedQty,
        dp.target_price  AS targetPrice,
        dp.status,
        dp.location,
        dp.deadline      AS time,
        dp.is_priority   AS isPriority,
        dp.created_at
      FROM demand_pool dp
      WHERE dp.status != 'fulfilled'
      ORDER BY dp.is_priority DESC, dp.created_at ASC
    `).all();

    const normalized = demands.map(d => ({ ...d, isPriority: d.isPriority === 1 }));
    return res.json({ demands: normalized });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import { getPool } from '../db/database.js';

const router = Router();

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/* ───────────────────────────────────────────────────────────────────────
   POST /api/demand
   Schema columns: buyer_id, crop, requested_qty, matched_qty,
                   target_price, status, deadline
   NOTE: No buyer_label, location, or is_priority in the live schema.
─────────────────────────────────────────────────────────────────────── */
router.post('/', async (req, res, next) => {
  try {
    const rawCrop     = sanitizeString(req.body.crop);
    const rawDeadline = sanitizeString(req.body.deadline);
    const buyerIdNum  = parseInt(req.body.buyer_id, 10) || req.user?.id || 4;
    const qtyNum      = parseFloat(req.body.requested_qty);
    const targetPrice = parseFloat(req.body.target_price);

    if (!rawCrop) {
      return res.status(400).json({ error: 'Validation Error: Crop name is required.' });
    }
    if (isNaN(qtyNum) || qtyNum <= 0 || !isFinite(qtyNum)) {
      return res.status(400).json({ error: 'Validation Error: requested_qty must be a positive finite number.' });
    }
    if (isNaN(targetPrice) || targetPrice <= 0) {
      return res.status(400).json({ error: 'Validation Error: target_price must be a positive number.' });
    }

    const pool = getPool();

    // Pre-calculate matched quantity from existing active listings
    const { rows: matchRows } = await pool.query(
      `SELECT COALESCE(SUM(qty), 0)::numeric AS matched
       FROM produce_listings
       WHERE LOWER(crop) = LOWER($1) AND status != 'fulfilled'`,
      [rawCrop]
    );
    const matched     = parseFloat(matchRows[0].matched) || 0;
    const initMatched = Math.min(matched, qtyNum);
    const initStatus  = initMatched >= qtyNum ? 'ready' : 'matching';

    const { rows: insertedRows } = await pool.query(
      `INSERT INTO demand_pool (buyer_id, crop, requested_qty, matched_qty, target_price, status, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [buyerIdNum, rawCrop, qtyNum, initMatched, targetPrice, initStatus, rawDeadline || null]
    );
    const newId = insertedRows[0].id;

    // Fetch the inserted row with aliased names matching the frontend contract
    const { rows: demandRows } = await pool.query(
      `SELECT id, buyer_id AS "buyerId", crop,
              requested_qty AS "requestedQty", matched_qty AS "matchedQty",
              target_price AS "targetPrice", status,
              deadline AS time, created_at
       FROM demand_pool WHERE id = $1`,
      [newId]
    );
    const demand = demandRows[0];
    // Supply frontend-expected fields not present in schema
    demand.buyerLabel  = `Buyer #${demand.buyerId}`;
    demand.location    = 'Nashik District';
    demand.isPriority  = false;

    return res.status(201).json({ success: true, demand });
  } catch (err) {
    next(err);
  }
});

/* ───────────────────────────────────────────────────────────────────────
   GET /api/demand/active
─────────────────────────────────────────────────────────────────────── */
router.get('/active', async (_req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, buyer_id AS "buyerId", crop,
              requested_qty AS "requestedQty", matched_qty AS "matchedQty",
              target_price AS "targetPrice", status,
              deadline AS time, created_at
       FROM demand_pool
       WHERE status != 'fulfilled'
       ORDER BY created_at ASC`
    );

    // Hydrate frontend-expected fields missing from schema
    const demands = rows.map((d, i) => ({
      ...d,
      buyerLabel: `Buyer #${d.buyerId}`,
      location:   'Nashik District',
      isPriority: i === 0, // Mark first result as priority for UI demo
    }));

    return res.json({ demands });
  } catch (err) {
    next(err);
  }
});

export default router;

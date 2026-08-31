import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

const HUB = { x: 185, y: 150, lat: 20.00, lng: 73.78 };

function generateFarmCoords(nodeIndex) {
  const angle   = (nodeIndex * 137.5) * (Math.PI / 180);
  const radiusX = 40 + (nodeIndex * 15) % 65;
  const radiusY = 30 + (nodeIndex * 12) % 55;
  const posX    = Math.round(Math.max(40, Math.min(140, HUB.x - radiusX * Math.cos(angle))));
  const posY    = Math.round(Math.max(35, Math.min(195, HUB.y + radiusY * Math.sin(angle))));
  const lat     = Number((HUB.lat + (posY - HUB.y) * -0.0015).toFixed(3));
  const lng     = Number((HUB.lng + (posX - HUB.x) * 0.0015).toFixed(3));
  return { posX, posY, lat, lng };
}

/**
 * Input sanitization helper
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, ''); // strip script tags / angle brackets
}

/* ───────────────────────────────────────────────────────────────────────
   POST /api/listings
   Accepts farmer input, validates/sanitizes payload, inserts into DB.
─────────────────────────────────────────────────────────────────────── */
router.post('/', (req, res, next) => {
  try {
    const rawCrop       = sanitizeString(req.body.crop);
    const rawFarmerName = sanitizeString(req.body.farmer_name);
    const farmerIdNum   = parseInt(req.body.farmer_id, 10) || 1;
    const qtyNum        = parseFloat(req.body.qty);
    const priceNum      = parseFloat(req.body.price);

    // ── Input Validation ──
    if (!rawCrop) {
      return res.status(400).json({ error: 'Validation Error: Crop name is required.' });
    }
    if (isNaN(qtyNum) || qtyNum <= 0 || !isFinite(qtyNum)) {
      return res.status(400).json({ error: 'Validation Error: Quantity must be a positive finite number.' });
    }
    if (isNaN(priceNum) || priceNum <= 0 || !isFinite(priceNum)) {
      return res.status(400).json({ error: 'Validation Error: Price must be a positive finite number.' });
    }

    const db = getDb();

    const { n: count } = db.prepare('SELECT COUNT(id) AS n FROM produce_listings').get();
    const nodeIndex   = count + 1;
    const farmLetter  = String.fromCharCode(65 + (count % 26));
    const name        = rawFarmerName || `Farm ${farmLetter}`;
    const { posX, posY, lat, lng } = generateFarmCoords(nodeIndex);

    // Insert listing with exact column binding
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO produce_listings (farmer_id, farmer_name, crop, qty, price, status, pos_x, pos_y, lat, lng)
      VALUES (?, ?, ?, ?, ?, 'listed', ?, ?, ?, ?)
    `).run(farmerIdNum, name, rawCrop, qtyNum, priceNum, posX, posY, lat, lng);

    // Auto-match demand: select only required columns instead of SELECT *
    const demand = db.prepare(`
      SELECT id, requested_qty, matched_qty, status 
      FROM demand_pool 
      WHERE LOWER(crop) = LOWER(?) AND status NOT IN ('ready','fulfilled') 
      LIMIT 1
    `).get(rawCrop);

    if (demand) {
      const newMatched = Math.min(demand.matched_qty + qtyNum, demand.requested_qty);
      const newStatus  = newMatched >= demand.requested_qty ? 'ready' : demand.status;
      db.prepare(`UPDATE demand_pool SET matched_qty = ?, status = ? WHERE id = ?`)
        .run(newMatched, newStatus, demand.id);
    }

    // Fetch newly created listing with explicit column selection
    const listing = db.prepare(`
      SELECT id, farmer_id, farmer_name AS name, crop, qty, price, status,
             pos_x AS x, pos_y AS y, lat, lng, created_at AS timestamp
      FROM produce_listings
      WHERE id = ?
    `).get(lastInsertRowid);

    return res.status(201).json({ success: true, listing });
  } catch (err) {
    next(err); // Pass async/sync error to global error handler
  }
});

/* ───────────────────────────────────────────────────────────────────────
   GET /api/listings/active
   Returns all active listings fetching only essential display columns.
─────────────────────────────────────────────────────────────────────── */
router.get('/active', (_req, res, next) => {
  try {
    const db = getDb();
    const listings = db.prepare(`
      SELECT
        id, farmer_id, farmer_name AS name, crop, qty, price, status,
        pos_x AS x, pos_y AS y, lat, lng, created_at AS timestamp
      FROM produce_listings
      WHERE status != 'fulfilled'
      ORDER BY created_at DESC
    `).all();

    return res.json({ listings });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import { getPool } from '../db/database.js';

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

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/* ───────────────────────────────────────────────────────────────────────
   POST /api/listings
   Schema columns: farmer_id, crop, qty, price, status, x, y, lat, lng
─────────────────────────────────────────────────────────────────────── */
router.post('/', async (req, res, next) => {
  try {
    const rawCrop     = sanitizeString(req.body.crop);
    const farmerIdNum = parseInt(req.body.farmer_id, 10) || req.user?.id || 1;
    const qtyNum      = parseFloat(req.body.qty);
    const priceNum    = parseFloat(req.body.price);

    if (!rawCrop) {
      return res.status(400).json({ error: 'Validation Error: Crop name is required.' });
    }
    if (isNaN(qtyNum) || qtyNum <= 0 || !isFinite(qtyNum)) {
      return res.status(400).json({ error: 'Validation Error: Quantity must be a positive finite number.' });
    }
    if (isNaN(priceNum) || priceNum <= 0 || !isFinite(priceNum)) {
      return res.status(400).json({ error: 'Validation Error: Price must be a positive finite number.' });
    }

    const pool = getPool();

    // Count existing to generate map coordinates
    const { rows: countRows } = await pool.query('SELECT COUNT(id)::int AS n FROM produce_listings');
    const count     = countRows[0].n;
    const nodeIndex = count + 1;
    const { posX, posY, lat, lng } = generateFarmCoords(nodeIndex);

    // Insert — schema uses x, y (not pos_x, pos_y); no farmer_name column
    const { rows: insertedRows } = await pool.query(
      `INSERT INTO produce_listings (farmer_id, crop, qty, price, status, x, y, lat, lng)
       VALUES ($1, $2, $3, $4, 'listed', $5, $6, $7, $8)
       RETURNING id`,
      [farmerIdNum, rawCrop, qtyNum, priceNum, posX, posY, lat, lng]
    );
    const newId = insertedRows[0].id;

    // Auto-match open demand for the same crop
    const { rows: demandRows } = await pool.query(
      `SELECT id, requested_qty, matched_qty, status
       FROM demand_pool
       WHERE LOWER(crop) = LOWER($1) AND status NOT IN ('ready','fulfilled')
       LIMIT 1`,
      [rawCrop]
    );
    const demand = demandRows[0];

    if (demand) {
      const newMatched = Math.min(Number(demand.matched_qty) + qtyNum, Number(demand.requested_qty));
      const newStatus  = newMatched >= Number(demand.requested_qty) ? 'ready' : demand.status;
      await pool.query(
        'UPDATE demand_pool SET matched_qty = $1, status = $2 WHERE id = $3',
        [newMatched, newStatus, demand.id]
      );
    }

    // Fetch and return the new listing with aliased columns
    // Schema: x, y (not pos_x, pos_y); no farmer_name
    const { rows: listingRows } = await pool.query(
      `SELECT id, farmer_id, crop, qty, price, status,
              x, y, lat, lng, created_at AS timestamp
       FROM produce_listings
       WHERE id = $1`,
      [newId]
    );
    const listing = listingRows[0];
    // Add a display name derived from the farmer_id for the map
    listing.name = `Farm ${String.fromCharCode(65 + (count % 26))}`;

    return res.status(201).json({ success: true, listing });
  } catch (err) {
    next(err);
  }
});

/* ───────────────────────────────────────────────────────────────────────
   GET /api/listings/active
─────────────────────────────────────────────────────────────────────── */
router.get('/active', async (_req, res, next) => {
  try {
    const pool = getPool();
    const { rows: listings } = await pool.query(
      `SELECT id, farmer_id, crop, qty, price, status,
              x, y, lat, lng, created_at AS timestamp
       FROM produce_listings
       WHERE status != 'fulfilled'
       ORDER BY created_at DESC`
    );

    // Generate display names for map nodes
    const named = listings.map((l, i) => ({
      ...l,
      name: `Farm ${String.fromCharCode(65 + (i % 26))}`,
    }));

    return res.json({ listings: named });
  } catch (err) {
    next(err);
  }
});

export default router;

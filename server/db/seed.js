/**
 * seed.js — Programmatic seed using bcryptjs so passwords are properly hashed.
 * Called by database.js when the DB is empty.
 */
import bcrypt from 'bcryptjs';

export function seedDatabase(db) {
  console.log('[DB] Seeding demo users & data…');

  const SALT_ROUNDS = 10;

  // ── Demo Users ──────────────────────────────────────
  const users = [
    { name: 'Ramesh Patel',             role: 'farmer',    email: 'farmer@demo.com',    password: 'farmer123', location: 'Nashik District', lat: 20.08, lng: 73.69 },
    { name: 'Priya Desai',              role: 'farmer',    email: 'priya@demo.com',     password: 'farmer123', location: 'Nashik District', lat: 19.92, lng: 73.71 },
    { name: 'Sanjay More',              role: 'farmer',    email: 'sanjay@demo.com',    password: 'farmer123', location: 'Nashik District', lat: 20.03, lng: 73.65 },
    { name: 'Local Grocers Combined',   role: 'buyer',     email: 'buyer@demo.com',     password: 'buyer123',  location: 'Nashik Hub',       lat: 20.00, lng: 73.78 },
    { name: 'FPO Batch #12 Sangamner', role: 'buyer',     email: 'fpo@demo.com',       password: 'buyer123',  location: 'Sangamner',        lat: 19.75, lng: 73.99 },
    { name: 'HarvestLink Admin',        role: 'logistics', email: 'admin@demo.com',     password: 'admin123',  location: 'Nashik HQ',        lat: 20.00, lng: 73.78 },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (name, role, email, password_hash, location, location_lat, location_lng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const userIds = {};
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
    const { lastInsertRowid } = insertUser.run(u.name, u.role, u.email, hash, u.location, u.lat, u.lng);
    userIds[u.email] = lastInsertRowid;
  }

  // ── Demo Produce Listings ──────────────────────────
  const insertListing = db.prepare(`
    INSERT INTO produce_listings (farmer_id, farmer_name, crop, qty, price, status, pos_x, pos_y, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertListing.run(userIds['farmer@demo.com'], 'Farm A', 'Tomato', 200, 25, 'assigned', 60,  55,  20.08, 73.69);
  insertListing.run(userIds['priya@demo.com'],  'Farm B', 'Onion',  120, 18, 'listed',   100, 170, 19.92, 73.71);
  insertListing.run(userIds['sanjay@demo.com'], 'Farm C', 'Potato', 150, 16, 'assigned', 75,  120, 20.03, 73.65);

  // ── Demo Demand Pool ───────────────────────────────
  const insertDemand = db.prepare(`
    INSERT INTO demand_pool (buyer_id, buyer_label, crop, requested_qty, matched_qty, target_price, status, location, deadline, is_priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDemand.run(userIds['buyer@demo.com'], '3 local grocers combined',  'Tomato', 450, 260, 28, 'matching', 'Nashik Hub, 12km away',      '18:00',         1);
  insertDemand.run(userIds['fpo@demo.com'],   'FPO Batch #12 — Sangamner', 'Onion',  800, 704, 21, 'ready',    'Sangamner, 28km away',        'tomorrow 09:00', 0);
  insertDemand.run(userIds['buyer@demo.com'], '2 hotel chains · Pune',     'Potato', 300,  70, 16, 'open',     'Pune Central Hub, 45km',      '+48h',           0);

  console.log('[DB] Seed complete. Demo credentials:');
  console.log('  Farmer  → farmer@demo.com / farmer123');
  console.log('  Buyer   → buyer@demo.com  / buyer123');
  console.log('  Admin   → admin@demo.com  / admin123');
}

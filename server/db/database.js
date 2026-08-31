/**
 * database.js — SQLite singleton using Node.js 22 built-in node:sqlite
 * Zero external native dependencies.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { seedDatabase } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '../../data');
const DB_PATH   = join(DATA_DIR, 'harvestlink.db');
const SCHEMA    = join(__dirname, 'schema.sql');

let _db = null;

export function getDb() {
  if (_db) return _db;

  // Ensure data directory exists
  mkdirSync(DATA_DIR, { recursive: true });

  _db = new DatabaseSync(DB_PATH);

  // Enable WAL mode and foreign keys
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA foreign_keys = ON;');

  // Run schema migration (idempotent)
  _db.exec(readFileSync(SCHEMA, 'utf8'));

  // Seed only on empty database
  const { n } = _db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n === 0) {
    seedDatabase(_db);
  }

  console.log(`[DB] ✓ ${DB_PATH}`);
  return _db;
}

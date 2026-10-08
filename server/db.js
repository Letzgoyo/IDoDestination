import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const file = process.env.DB_PATH || 'data/idodestination.db'
mkdirSync(dirname(file), { recursive: true })
export const db = new DatabaseSync(file)

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  bio TEXT NOT NULL,
  price_from_aud INTEGER,
  offers_trial INTEGER NOT NULL DEFAULT 0,
  trial_price_aud INTEGER,
  based_in_australia INTEGER NOT NULL DEFAULT 0,
  instagram TEXT,
  website TEXT,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wedding_date TEXT,
  guest_count INTEGER,
  wants_trial INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'package' CHECK (type IN ('trial','package','deposit')),
  price_aud INTEGER NOT NULL CHECK (price_aud > 0),
  instant INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  vendor_token TEXT UNIQUE NOT NULL,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','declined','paid','cancelled')),
  couple_name TEXT NOT NULL,
  couple_email TEXT NOT NULL,
  wedding_date TEXT,
  guest_count INTEGER,
  message TEXT,
  amount_aud INTEGER NOT NULL,
  fee_aud INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  payment_intent_id TEXT,
  refund_aud INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS vendor_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  position INTEGER NOT NULL DEFAULT 0,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_photos_vendor ON vendor_photos(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
`)

// Lightweight migrations for columns added after first release.
const cols = db.prepare('PRAGMA table_info(vendors)').all().map((c) => c.name)
for (const [name, ddl] of [
  ['manage_token', 'TEXT'],
  ['apply_token', 'TEXT'],
  ['stripe_account_id', 'TEXT'],
  ['stripe_ready', 'INTEGER NOT NULL DEFAULT 0'],
]) if (!cols.includes(name)) db.exec(`ALTER TABLE vendors ADD COLUMN ${name} ${ddl}`)

// Databases created before cancellations existed need the bookings table rebuilt (CHECK constraint can't be altered).
const bookingsSql = db.prepare("SELECT sql FROM sqlite_master WHERE name='bookings'").get().sql
if (!bookingsSql.includes('cancelled')) {
  const old = db.prepare('PRAGMA table_info(bookings)').all().map((c) => c.name)
  db.exec('BEGIN; ALTER TABLE bookings RENAME TO bookings_old;')
  db.exec(`CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, vendor_token TEXT UNIQUE NOT NULL,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id), service_id INTEGER NOT NULL REFERENCES services(id),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','declined','paid','cancelled')),
    couple_name TEXT NOT NULL, couple_email TEXT NOT NULL, wedding_date TEXT, guest_count INTEGER, message TEXT,
    amount_aud INTEGER NOT NULL, fee_aud INTEGER NOT NULL DEFAULT 0, stripe_session_id TEXT, payment_intent_id TEXT,
    refund_aud INTEGER NOT NULL DEFAULT 0, paid_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`)
  db.exec(`INSERT INTO bookings (${old.join(',')}) SELECT ${old.join(',')} FROM bookings_old; DROP TABLE bookings_old; COMMIT;`)
}

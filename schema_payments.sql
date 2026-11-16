-- Tabel pembayaran Bunda Journal (Cloudflare D1).
-- Jalankan: npx wrangler d1 execute bunda-journal-db --remote --file=schema_payments.sql

CREATE TABLE IF NOT EXISTS bunda_subscriptions (
  email TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'essential',
  amount INTEGER,
  is_paid INTEGER NOT NULL DEFAULT 0,
  order_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bunda_orders (
  order_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  tier TEXT,
  amount INTEGER,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bunda_orders_email ON bunda_orders(email);
CREATE INDEX IF NOT EXISTS idx_bunda_orders_status ON bunda_orders(status);
CREATE INDEX IF NOT EXISTS idx_bunda_subscriptions_paid ON bunda_subscriptions(is_paid);

-- Web Push: subscription per perangkat + jadwal pengingat (bukan isi jurnal).
-- Jalankan: npx wrangler d1 execute bunda-journal-db --remote --file=schema_push.sql

CREATE TABLE IF NOT EXISTS push_subscriptions (
  device_id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_email TEXT,
  tz_offset_minutes INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_reminders (
  subscription_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  time_local TEXT NOT NULL,
  time_utc TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_sent_date TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_push_reminders_due
  ON push_reminders(time_utc, enabled, last_sent_date);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email
  ON push_subscriptions(user_email);

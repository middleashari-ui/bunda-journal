CREATE TABLE IF NOT EXISTS bunda_users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bunda_sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS bunda_user_data (
  email TEXT PRIMARY KEY,
  payload TEXT,
  updated_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_sessions_email ON bunda_sessions(email);

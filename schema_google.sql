CREATE TABLE IF NOT EXISTS bunda_oauth_states (
  state TEXT PRIMARY KEY,
  plan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_created ON bunda_oauth_states(created_at);

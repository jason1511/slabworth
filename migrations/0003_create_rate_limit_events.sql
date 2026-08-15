CREATE TABLE IF NOT EXISTS rate_limit_events (
  rate_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_key_created_at
ON rate_limit_events (rate_key, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created_at
ON rate_limit_events (created_at);

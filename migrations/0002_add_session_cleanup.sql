ALTER TABLE analyses
ADD COLUMN session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_analyses_session_id_created_at
ON analyses (session_id, created_at DESC);
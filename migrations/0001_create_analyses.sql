CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  card_name TEXT,
  card_set TEXT,
  card_number TEXT,
  rarity TEXT,

  grade_score INTEGER,
  grade_label TEXT,
  match_status TEXT,

  front_image_key TEXT,
  back_image_key TEXT,

  result_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at
ON analyses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_card_name
ON analyses (card_name);

CREATE INDEX IF NOT EXISTS idx_analyses_grade_score
ON analyses (grade_score);
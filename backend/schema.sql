CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0
);


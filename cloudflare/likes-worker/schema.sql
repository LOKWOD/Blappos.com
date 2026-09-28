CREATE TABLE IF NOT EXISTS likes (
  story_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (story_id, voter_hash)
);
CREATE INDEX IF NOT EXISTS idx_likes_story ON likes(story_id);

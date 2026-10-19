-- Optional, private, free lesson progress. Additive and independently approved.
-- Main and PR #240 were inspected: 0001-0008 are already reserved.
-- This separate directory is NOT consumed by any existing deployment workflow.
-- Require approved encrypted backup/restore and preview acceptance before apply.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_learning_progress (
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL
    CHECK (length(lesson_slug) BETWEEN 3 AND 64 AND lesson_slug NOT GLOB '*[^a-z0-9-]*'),
  lesson_version TEXT NOT NULL CHECK (length(lesson_version) BETWEEN 5 AND 24),
  completed INTEGER NOT NULL CHECK (completed IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 1000000),
  updated_at INTEGER NOT NULL CHECK (updated_at > 0),
  PRIMARY KEY(user_id,lesson_slug)
);
CREATE INDEX IF NOT EXISTS member_learning_progress_updated
  ON member_learning_progress(user_id, updated_at DESC);

-- One bounded fixed-window counter per member; no IP/device tracking.
CREATE TABLE IF NOT EXISTS member_learning_write_limits (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  window_start INTEGER NOT NULL CHECK (window_start >= 0),
  mutations INTEGER NOT NULL CHECK (mutations BETWEEN 1 AND 12)
);

-- ANEVUM Commons: member abuse reports, private moderator queue.
-- Additive preview-only D1 migration. Never alters RHEN execution or billing.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commons_reports (
  id TEXT PRIMARY KEY NOT NULL,
  reporter_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  topic_id TEXT REFERENCES commons_topics(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES commons_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK(reason IN ('spam','harassment','privacy','misleading_claims','other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed')),
  reviewed_by TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((topic_id IS NOT NULL AND comment_id IS NULL) OR
         (topic_id IS NULL AND comment_id IS NOT NULL)),
  UNIQUE(reporter_id, topic_id),
  UNIQUE(reporter_id, comment_id)
);
CREATE INDEX IF NOT EXISTS commons_reports_queue_idx ON commons_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS commons_reports_reporter_idx ON commons_reports(reporter_id, created_at DESC);

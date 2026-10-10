-- ANEVUM V5 Commons discussion pilot. Separate, unapplied migration.
-- Stage only after reviewed 0004/0005 lineage, backup, and moderator coverage.
-- NOT in the default migrations directory: authorizing F0 cannot enable social writes.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commons_v5_posts (
  id TEXT PRIMARY KEY NOT NULL,
  author_user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  topic TEXT NOT NULL CHECK(topic IN ('systems','engineering','research','releases')),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 120),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 20 AND 3000),
  status TEXT NOT NULL DEFAULT 'PUBLISHED'
    CHECK(status IN ('PUBLISHED','HIDDEN','REMOVED')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS commons_v5_posts_published_topic
  ON commons_v5_posts(status, topic, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS commons_v5_posts_author
  ON commons_v5_posts(author_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS commons_v5_replies (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES commons_v5_posts(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 2 AND 1000),
  status TEXT NOT NULL DEFAULT 'PUBLISHED'
    CHECK(status IN ('PUBLISHED','HIDDEN','REMOVED')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS commons_v5_replies_visible
  ON commons_v5_replies(post_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS commons_v5_replies_author
  ON commons_v5_replies(author_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS commons_v5_reports (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES commons_v5_posts(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK(reason IN ('spam','harassment','privacy','misinformation','other')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','REVIEWED','DISMISSED')),
  created_at INTEGER NOT NULL,
  UNIQUE(post_id,reporter_user_id)
);
CREATE INDEX IF NOT EXISTS commons_v5_reports_review
  ON commons_v5_reports(status,created_at ASC);

CREATE TABLE IF NOT EXISTS commons_v5_moderation_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  target_post_id TEXT REFERENCES commons_v5_posts(id) ON DELETE SET NULL,
  report_id TEXT UNIQUE REFERENCES commons_v5_reports(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK(action IN ('hide_post','restore_post','resolve_report','dismiss_report')),
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 8 AND 500),
  occurred_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS commons_v5_moderation_events_at
  ON commons_v5_moderation_events(occurred_at DESC);

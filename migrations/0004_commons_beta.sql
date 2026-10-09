-- ANEVUM Commons invite-only research beta.
-- This extends member identity, NOT owner RHEN/Alpaca permissions.
-- All contributed content is private to admitted Commons members.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commons_members (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor','moderator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  invited_by TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commons_topics (
  id TEXT PRIMARY KEY NOT NULL,
  author_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('question','research_note')),
  subject TEXT NOT NULL CHECK (subject IN ('markets','algorithms','software','mathematics')),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 8 AND 120),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 30 AND 3000),
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('members','hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS commons_topics_recent_idx ON commons_topics (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS commons_topics_author_idx ON commons_topics (author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS commons_comments (
  id TEXT PRIMARY KEY NOT NULL,
  topic_id TEXT NOT NULL REFERENCES commons_topics(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 3 AND 1500),
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('members','hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS commons_comments_topic_idx ON commons_comments (topic_id, created_at ASC);
CREATE INDEX IF NOT EXISTS commons_comments_author_idx ON commons_comments (author_id, created_at DESC);

-- Every moderator conceal/restore action is attributable and does not delete evidence.
CREATE TABLE IF NOT EXISTS commons_moderation_events (
  id TEXT PRIMARY KEY NOT NULL,
  moderator_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('topic','comment')),
  item_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('hide','restore')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS commons_mod_events_recent_idx ON commons_moderation_events (created_at DESC);

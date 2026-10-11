-- ANEVUM Studio editorial records. Draft/manual migration: DO NOT apply to
-- production before approved D1 backup, identity/Access binding and release.
-- Independent of 0006/0007 Commons discussions pilot. No brokerage access.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS studio_entries (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('POST','UPDATE','AHA')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 120),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 15 AND 280),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 20 AND 12000),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1),
  created_by_member_id TEXT NOT NULL,
  updated_by_member_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS studio_entries_public
  ON studio_entries(status,kind,published_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS studio_entries_updated
  ON studio_entries(updated_at DESC,id DESC);

CREATE TABLE IF NOT EXISTS studio_entry_events (
  id TEXT PRIMARY KEY NOT NULL,
  entry_id TEXT NOT NULL REFERENCES studio_entries(id) ON DELETE RESTRICT,
  actor_member_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE','EDIT','PUBLISH','UNPUBLISH','ARCHIVE')),
  revision INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(entry_id,revision)
);
CREATE INDEX IF NOT EXISTS studio_events_entry
  ON studio_entry_events(entry_id,created_at DESC);

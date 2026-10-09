-- ANEVUM Commons: private, user-owned method-first research.
-- Preview-only; 0007 follows the separate 0006 member Alpaca connection migration.
-- No public publishing, brokerage permissions, automatic strategy promotion or payments.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commons_private_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('question','hypothesis','experiment','replication','review','correction')),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 8 AND 120),
  research_question TEXT NOT NULL CHECK (length(trim(research_question)) BETWEEN 10 AND 1200),
  method TEXT NOT NULL CHECK (length(trim(method)) BETWEEN 20 AND 2000),
  sources TEXT NOT NULL DEFAULT '' CHECK (length(sources) <= 1500),
  uncertainty TEXT NOT NULL CHECK (uncertainty IN ('unknown','low','moderate','high')),
  result TEXT NOT NULL DEFAULT '' CHECK (length(result) <= 1200),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version BETWEEN 1 AND 16),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS commons_private_drafts_owner_idx
  ON commons_private_drafts (user_id, updated_at DESC, id DESC);

-- Immutable archived snapshots. The parent draft deletion cascades to revisions.
CREATE TABLE IF NOT EXISTS commons_private_revisions (
  draft_id TEXT NOT NULL REFERENCES commons_private_drafts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version BETWEEN 1 AND 15),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  research_question TEXT NOT NULL,
  method TEXT NOT NULL,
  sources TEXT NOT NULL,
  uncertainty TEXT NOT NULL,
  result TEXT NOT NULL,
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (draft_id, version)
);

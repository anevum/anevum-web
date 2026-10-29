-- Existing table preserved, including all original owner values.
CREATE TABLE IF NOT EXISTS entries (
 id TEXT PRIMARY KEY, owner TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('note','journal','task','idea')),
 title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entries_owner_updated ON entries(owner, updated_at DESC);

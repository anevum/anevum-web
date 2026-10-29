-- Apply once after checking PRAGMA table_info(entries). All changes additive.
ALTER TABLE entries ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN collection TEXT NOT NULL DEFAULT '';
ALTER TABLE entries ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE entries ADD COLUMN due_date TEXT NOT NULL DEFAULT '';
ALTER TABLE entries ADD COLUMN deferred_until TEXT NOT NULL DEFAULT '';
ALTER TABLE entries ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS preferences (
 owner TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS entries_owner_review ON entries(owner, archived, is_draft, status, deferred_until);

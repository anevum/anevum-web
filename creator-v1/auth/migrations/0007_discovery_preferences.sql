-- ANEVUM Creator V1 / STAGING ONLY: member-owned discovery interests.
-- Prerequisites: 0003 member identity; uses the isolated creator-v1 staging D1.
-- No public feed, project submission, rating, XP or visibility change.
-- Existing production and V5 databases must not receive this migration.
CREATE TABLE IF NOT EXISTS member_discovery_preferences (
  member_id TEXT PRIMARY KEY NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  categories_json TEXT NOT NULL CHECK(json_valid(categories_json) AND json_type(categories_json)='array' AND length(categories_json)<=140),
  updated_at INTEGER NOT NULL CHECK(updated_at>=0)
);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0007_discovery_preferences');

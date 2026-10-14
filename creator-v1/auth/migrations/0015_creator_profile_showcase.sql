-- ANEVUM V007 member-selected public creator showcases.
-- STAGING REVIEW ONLY: do not execute before explicit DB migration approval.
-- Existing identity, published project, moderation and XP tables are authoritative.
-- This table holds only presentation choices; it does NOT award inventory or XP.
CREATE TABLE IF NOT EXISTS member_showcase_selections (
  member_id TEXT PRIMARY KEY NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
  artifact_key TEXT CHECK(artifact_key IS NULL OR length(artifact_key) BETWEEN 1 AND 80),
  award_keys_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(award_keys_json) AND json_type(award_keys_json)='array'),
  is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision BETWEEN 1 AND 2147483647),
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0015_creator_profile_showcase');

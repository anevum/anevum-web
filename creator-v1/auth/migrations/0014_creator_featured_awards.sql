-- Creator V1 staged profile showcase preference. Apply only after authenticated
-- owner/session, privacy retention, cross-account and recovery acceptance.
-- Never apply to the public read-only D1 or the archived V5/RHEN stores.
-- A highlighted award is a presentation choice, not XP, rank or privilege.
CREATE TABLE IF NOT EXISTS creator_featured_awards (
  member_id TEXT PRIMARY KEY NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
  award_key TEXT CHECK(award_key IS NULL OR award_key IN (
    'first-signal','keen-eye','portal-guide','first-launch','three-builds','release-steward'
  )),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1),
  updated_at INTEGER NOT NULL CHECK(updated_at > 0)
);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0014_creator_featured_awards');

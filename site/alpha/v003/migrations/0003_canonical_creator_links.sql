-- V010 isolated package stage only. Apply after backup and restore rehearsal.
-- Do not run against canonical user/Creator Studio DB.
CREATE TABLE IF NOT EXISTS anevum_package_creator_links (
  owner_id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  profile_created_at INTEGER NOT NULL CHECK (profile_created_at > 0),
  verified_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anevum_package_creator_handle
  ON anevum_package_creator_links(handle);

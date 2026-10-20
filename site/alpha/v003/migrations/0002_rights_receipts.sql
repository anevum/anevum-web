-- ANEVUM package v003: safe additive migration for existing isolated stage DBs.
-- Apply only after staging DB backup/restore, schema inventory, and explicit release authorization.
-- No published changes, no production member DB mutation.
CREATE TABLE IF NOT EXISTS anevum_package_rights_receipts (
  release_id TEXT PRIMARY KEY REFERENCES anevum_package_releases(id),
  owner_id TEXT NOT NULL,
  attested_at INTEGER NOT NULL,
  statement TEXT NOT NULL CHECK (statement='creator_has_publication_rights_v1')
);

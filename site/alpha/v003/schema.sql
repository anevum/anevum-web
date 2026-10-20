-- ANEVUM package runtime v003: additive to anevum-canonical-member-staging.
-- No existing member, creator, V5, or alpha-v002 table is modified.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS anevum_package_projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('game','app','simulation','story')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','published','rejected','suspended','deleted')),
  live_release_id TEXT,
  draft_release_id TEXT,
  review_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_anevum_package_projects_owner
 ON anevum_package_projects(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_anevum_package_projects_public
 ON anevum_package_projects(status, published_at DESC);
CREATE TABLE IF NOT EXISTS anevum_package_releases (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES anevum_package_projects(id),
  version INTEGER NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('preparing','ready','pending_review','published','rejected','failed','revoked')),
  source_name TEXT NOT NULL,
  proposed_title TEXT NOT NULL,
  proposed_summary TEXT NOT NULL,
  proposed_category TEXT NOT NULL,
  archive_sha256 TEXT,
  archive_bytes INTEGER NOT NULL CHECK (archive_bytes >= 0),
  expanded_bytes INTEGER NOT NULL DEFAULT 0 CHECK (expanded_bytes >= 0),
  file_count INTEGER NOT NULL DEFAULT 0 CHECK (file_count >= 0),
  source_key TEXT,
  review_reason TEXT,
  reviewed_by TEXT,
  reviewed_at INTEGER,
  submitted_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE(project_id, version)
);
CREATE INDEX IF NOT EXISTS idx_anevum_package_releases_project
 ON anevum_package_releases(project_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_anevum_package_releases_queue
 ON anevum_package_releases(status, submitted_at);
CREATE TABLE IF NOT EXISTS anevum_package_files (
  release_id TEXT NOT NULL REFERENCES anevum_package_releases(id),
  path TEXT NOT NULL,
  object_key TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes >= 0),
  sha256 TEXT NOT NULL,
  PRIMARY KEY(release_id, path)
);
CREATE TABLE IF NOT EXISTS anevum_package_upload_limits (
  owner_id TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);

CREATE TABLE IF NOT EXISTS anevum_package_preview_tokens (
  token_hash TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES anevum_package_releases(id),
  issued_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anevum_package_preview_tokens_expiry
  ON anevum_package_preview_tokens(expires_at);

-- Immutable, release-specific creator rights statement. Required on every new upload.
-- Do not treat self-attestation as independent copyright or malware verification.
CREATE TABLE IF NOT EXISTS anevum_package_rights_receipts (
  release_id TEXT PRIMARY KEY REFERENCES anevum_package_releases(id),
  owner_id TEXT NOT NULL,
  attested_at INTEGER NOT NULL,
  statement TEXT NOT NULL CHECK (statement='creator_has_publication_rights_v1')
);

-- Canonically verified owner/handle mapping. Never trust a submitted browser handle.
-- Public read APIs must re-check visibility with canonical member service.
CREATE TABLE IF NOT EXISTS anevum_package_creator_links (
  owner_id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  profile_created_at INTEGER NOT NULL CHECK (profile_created_at > 0),
  creator_proof TEXT CHECK (creator_proof IS NULL OR length(creator_proof)=64),
  verified_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anevum_package_creator_handle
  ON anevum_package_creator_links(handle);

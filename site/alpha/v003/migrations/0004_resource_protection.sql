-- ANEVUM PACKAGE V004 — additive only; restore-test staging D1 before applying.
CREATE TABLE IF NOT EXISTS anevum_package_upload_leases (
  owner_id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_package_upload_leases_expiry ON anevum_package_upload_leases(expires_at);
CREATE TABLE IF NOT EXISTS anevum_package_upload_reservations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  release_id TEXT NOT NULL UNIQUE,
  physical_bytes INTEGER NOT NULL CHECK (physical_bytes > 0),
  object_prefix TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('uploading','cleanup')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_package_reservations_owner ON anevum_package_upload_reservations(owner_id);
CREATE INDEX IF NOT EXISTS idx_package_reservations_expiry ON anevum_package_upload_reservations(expires_at, status);
CREATE TABLE IF NOT EXISTS anevum_package_daily_limits (
  owner_id TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  upload_bytes INTEGER NOT NULL DEFAULT 0 CHECK (upload_bytes >= 0)
);
CREATE TABLE IF NOT EXISTS anevum_package_build_retention (
  release_id TEXT PRIMARY KEY REFERENCES anevum_package_releases(id),
  mode TEXT NOT NULL CHECK (mode IN ('test','saved')),
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK ((mode='test' AND expires_at IS NOT NULL) OR (mode='saved' AND expires_at IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_package_build_expiry ON anevum_package_build_retention(mode, expires_at);
CREATE TABLE IF NOT EXISTS anevum_package_cleanup_jobs (
  release_id TEXT PRIMARY KEY REFERENCES anevum_package_releases(id),
  physical_bytes INTEGER NOT NULL CHECK (physical_bytes >= 0),
  reason TEXT NOT NULL CHECK (reason IN ('replaced','discarded','expired','deleted','rejected')),
  not_before INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_package_cleanup_due ON anevum_package_cleanup_jobs(not_before, attempts);
CREATE INDEX IF NOT EXISTS idx_package_release_project_sha ON anevum_package_releases(project_id, archive_sha256, status);
CREATE INDEX IF NOT EXISTS idx_package_project_owner_status ON anevum_package_projects(owner_id, status);

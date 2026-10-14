-- STAGING ONLY: upload reservation, private quarantine lifecycle, rollback-safe metadata.
-- Additive after accepted Creator V1 0007-0013 lineage, and a verified staging backup and restore; never run automatically.
-- Does not enable public file delivery, application execution, or trust uploaded bytes.
CREATE TABLE project_assets(
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE RESTRICT,
 filename TEXT NOT NULL CHECK(length(filename) BETWEEN 1 AND 160),
 extension TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('image','audio','document','package')),
 content_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 20971520),
 status TEXT NOT NULL CHECK(status IN ('reserved','uploading','quarantined','deleting')),
 storage_key TEXT NOT NULL UNIQUE,
 sha256 TEXT,
 lease_until INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 uploaded_at TEXT,
 CHECK(sha256 IS NULL OR length(sha256)=64),
 CHECK(lease_until IS NULL OR lease_until>0)
);
CREATE INDEX idx_project_assets_project ON project_assets(project_id,owner_member_id,created_at DESC);
CREATE INDEX idx_project_assets_quota ON project_assets(owner_member_id,size_bytes);
CREATE INDEX idx_project_assets_reaper ON project_assets(status,lease_until,created_at);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0014_private_creator_assets');

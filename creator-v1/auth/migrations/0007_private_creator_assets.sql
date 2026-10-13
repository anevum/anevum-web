-- STAGING ONLY: private uploads are quarantined and never publicly served.
CREATE TABLE project_assets(
 id TEXT PRIMARY KEY NOT NULL,
 project_id TEXT NOT NULL REFERENCES projects(id),
 owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id),
 filename TEXT NOT NULL,
 extension TEXT NOT NULL,
 kind TEXT NOT NULL,
 content_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 20971520),
 status TEXT NOT NULL CHECK(status IN ('reserved','uploading','quarantined')),
 storage_key TEXT NOT NULL UNIQUE,
 sha256 TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 uploaded_at TEXT
);
CREATE INDEX idx_project_assets_project ON project_assets(project_id,owner_member_id);
CREATE INDEX idx_project_assets_quota ON project_assets(owner_member_id,size_bytes);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0007_private_creator_assets');
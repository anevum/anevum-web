-- ANEVUM.WEB.BUILD.2026-10-26.001.CREATOR-UPLOAD-FOUNDATION
-- ADDITIVE REVIEW/STAGING-ONLY MIGRATION. Apply only after D1 backup/restore.
-- Never apply to production automatically. Original 20 MiB assets are unchanged.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_studio_large_assets (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE RESTRICT,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 filename TEXT NOT NULL CHECK(length(filename) BETWEEN 1 AND 160),
 extension TEXT NOT NULL CHECK(extension IN ('zip','mp4','webm')),
 kind TEXT NOT NULL CHECK(kind IN ('package','video')),
 content_type TEXT NOT NULL CHECK(content_type IN ('application/zip','video/mp4','video/webm')),
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 20971521 AND 1073741824),
 status TEXT NOT NULL CHECK(status IN ('reserved','uploading','quarantined','deleting')),
 storage_key TEXT NOT NULL UNIQUE CHECK(length(storage_key)<=200),
 upload_id TEXT,
 part_size INTEGER NOT NULL CHECK(part_size=8388608),
 part_count INTEGER NOT NULL CHECK(part_count BETWEEN 3 AND 128),
 manifest_sha256 TEXT CHECK(manifest_sha256 IS NULL OR length(manifest_sha256)=64),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 updated_at INTEGER NOT NULL CHECK(updated_at>0),
 lease_until INTEGER,
 uploaded_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_member_large_asset_owner
 ON member_studio_large_assets(user_id,project_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_large_asset_cleanup
 ON member_studio_large_assets(status,lease_until,created_at);

CREATE TABLE IF NOT EXISTS member_studio_large_parts (
 asset_id TEXT NOT NULL REFERENCES member_studio_large_assets(id) ON DELETE CASCADE,
 part_number INTEGER NOT NULL CHECK(part_number BETWEEN 1 AND 128),
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 8388608),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 etag TEXT NOT NULL CHECK(length(etag) BETWEEN 1 AND 128),
 PRIMARY KEY(asset_id,part_number)
);

-- Frozen review proof for large, still-untrusted attachments. This table is
-- distinct from V050 because its old snapshot table enforces <=20 MiB.
CREATE TABLE IF NOT EXISTS member_studio_submission_large_assets (
 submission_id TEXT NOT NULL REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 asset_id TEXT NOT NULL CHECK(length(asset_id)=32),
 filename TEXT NOT NULL CHECK(length(filename) BETWEEN 1 AND 160),
 kind TEXT NOT NULL CHECK(kind IN ('package','video')),
 content_type TEXT NOT NULL CHECK(content_type IN ('application/zip','video/mp4','video/webm')),
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 20971521 AND 1073741824),
 manifest_sha256 TEXT NOT NULL CHECK(length(manifest_sha256)=64),
 PRIMARY KEY(submission_id,asset_id)
);
CREATE INDEX IF NOT EXISTS idx_submission_large_asset_id
 ON member_studio_submission_large_assets(asset_id);

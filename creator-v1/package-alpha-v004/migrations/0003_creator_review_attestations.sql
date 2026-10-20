-- ANEVUM Creator Compatibility V005 — additive, staging-only until approved.
-- Staff verification is bound to an immutable release ID and source SHA256.
CREATE TABLE IF NOT EXISTS anevum_package_review_attestations (
 release_id TEXT PRIMARY KEY REFERENCES anevum_package_releases(id) ON DELETE CASCADE,
 archive_sha256 TEXT NOT NULL CHECK(length(archive_sha256)=64),
 reviewer_id TEXT NOT NULL,
 verified_at INTEGER NOT NULL,
 checks_json TEXT NOT NULL CHECK(length(checks_json) BETWEEN 20 AND 4096)
);
CREATE INDEX IF NOT EXISTS idx_package_review_verified_at ON anevum_package_review_attestations(verified_at);

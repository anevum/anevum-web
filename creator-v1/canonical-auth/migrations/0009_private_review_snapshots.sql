-- ANEVUM Creator Studio V050 (review-only): frozen review receipts.
-- Apply to canonical staging MEMBER_DB ONLY after 0008 migration, backup and restore.
-- No table here may publish or execute a user-uploaded file.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS member_studio_submissions (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 project_revision INTEGER NOT NULL CHECK(project_revision>=2),
 slug TEXT NOT NULL CHECK(length(slug) BETWEEN 3 AND 90),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 100),
 summary TEXT NOT NULL CHECK(length(summary) BETWEEN 10 AND 280),
 description TEXT NOT NULL CHECK(length(description)<=8000),
 category TEXT NOT NULL CHECK(length(category) BETWEEN 3 AND 30),
 free_to_use INTEGER NOT NULL CHECK(free_to_use IN (0,1)),
 license_name TEXT NOT NULL CHECK(length(license_name)<=80),
 source_url TEXT,
 demo_url TEXT,
 ai_disclosure TEXT NOT NULL CHECK(length(ai_disclosure)<=1200),
 human_contribution TEXT NOT NULL CHECK(length(human_contribution)<=1200),
 status TEXT NOT NULL CHECK(status IN ('pending_review','withdrawn','changes_requested','rejected')),
 submitted_at INTEGER NOT NULL CHECK(submitted_at>0),
 resolved_at INTEGER,
 UNIQUE(project_id,project_revision)
);
CREATE INDEX IF NOT EXISTS idx_member_studio_submissions_owner
 ON member_studio_submissions(user_id,project_id,project_revision DESC);
CREATE INDEX IF NOT EXISTS idx_member_studio_submissions_staff
 ON member_studio_submissions(status,submitted_at,project_id);

CREATE TABLE IF NOT EXISTS member_studio_submission_assets (
 submission_id TEXT NOT NULL REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 asset_id TEXT NOT NULL CHECK(length(asset_id)=32),
 filename TEXT NOT NULL CHECK(length(filename) BETWEEN 1 AND 160),
 kind TEXT NOT NULL CHECK(kind IN ('image','audio','video','document','package')),
 content_type TEXT NOT NULL CHECK(length(content_type) BETWEEN 3 AND 80),
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 20971520),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 PRIMARY KEY(submission_id,asset_id)
);
CREATE INDEX IF NOT EXISTS idx_member_studio_submission_assets
 ON member_studio_submission_assets(asset_id);

-- Reviewer audit rows must identify the exact reviewed submission, not just
-- a mutable project. Migration is applied once through the migration ledger.
ALTER TABLE member_studio_review_log
 ADD COLUMN submission_id TEXT REFERENCES member_studio_submissions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_member_studio_review_log_submission
 ON member_studio_review_log(submission_id);

-- ANEVUM Native Pack V003: bounded, auditable staff-only text inspection.
-- SOURCE ONLY: apply only to backed-up canonical staging MEMBER_DB after 0009.
-- This table never stores original text, binary file bytes or storage keys.
-- No publication/approval action is created by this migration.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_studio_native_inspections (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 submission_id TEXT NOT NULL REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 reviewer_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 asset_id TEXT NOT NULL CHECK(length(asset_id)=32),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 action TEXT NOT NULL DEFAULT 'attempt_text_summary' CHECK(action IN ('attempt_text_summary','view_text_summary')),
 created_at INTEGER NOT NULL CHECK(created_at>0)
);

CREATE INDEX IF NOT EXISTS idx_member_studio_native_inspections_submission
 ON member_studio_native_inspections(submission_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_studio_native_inspections_reviewer
 ON member_studio_native_inspections(reviewer_id,created_at DESC);

-- ANEVUM V1: MEMBER PROJECT WORKFLOW; STAGING ONLY.
-- Prerequisite: migrations 0001, 0002, 0003 in anevum-creator-v1-staging.
-- Never apply to the archived V5 membership databases or public production D1.
ALTER TABLE projects ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1);
CREATE TABLE project_submission_events (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  actor_kind TEXT NOT NULL CHECK(actor_kind IN ('creator','staff')),
  actor_identity TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create','edit','submit','request_changes','publish','reject')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 800),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_submission_events_project ON project_submission_events(project_id,created_at DESC);
CREATE INDEX idx_member_review_queue ON projects(status,updated_at DESC,owner_member_id);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0004_member_project_workflow');
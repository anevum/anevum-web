-- ANEVUM V1 STAGING ONLY: staff workflow events.
-- This migration must NOT run against V5 membership or production community D1.
CREATE TABLE IF NOT EXISTS project_workflow_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create','edit','submit','publish','archive')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workflow_history ON project_workflow_events(project_id, created_at);
-- ANEVUM is a first-party staging creator. Actual people are authenticated
-- through Cloudflare Access; being a creator in D1 NEVER authenticates anyone.
INSERT OR IGNORE INTO creator_profiles
  (member_id, handle, display_name, bio, is_staff, status)
VALUES ('anevum-official','anevum','ANEVUM','First-party tools and experiments by ANEVUM.',1,'active');
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0002_staff_authoring');
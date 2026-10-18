-- V080 staff owner actions, isolated migration; do not apply directly to production.
CREATE TABLE IF NOT EXISTS anevum_alpha_project_admin_events (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL CHECK(action IN ('unpublish','restore','delete')), previous_status TEXT NOT NULL, next_status TEXT NOT NULL, title TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_alpha_admin_events_project ON anevum_alpha_project_admin_events(project_id,created_at DESC);
CREATE TABLE IF NOT EXISTS anevum_alpha_project_deletions (project_id TEXT PRIMARY KEY, title TEXT NOT NULL, owner_id TEXT NOT NULL, object_key TEXT NOT NULL, sha256 TEXT NOT NULL, requested_by TEXT NOT NULL, requested_at INTEGER NOT NULL, cleaned_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT);
CREATE INDEX IF NOT EXISTS idx_alpha_deletions_cleanup ON anevum_alpha_project_deletions(cleaned_at,requested_at DESC);

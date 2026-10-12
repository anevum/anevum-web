-- ANEVUM V1 0.6: privacy exports and deletion REQUESTS, staging only.
-- The request table does not delete members or content. Fulfillment requires
-- a separate reviewed retention, unpublish, audit, backup and purge workflow.
CREATE TABLE IF NOT EXISTS member_deletion_requests (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'requested' CHECK(state IN ('requested','cancelled','processing','completed','rejected')),
  requested_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(updated_at >= requested_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_active_deletion_request
  ON member_deletion_requests(member_id) WHERE state IN ('requested','processing');
CREATE INDEX IF NOT EXISTS idx_member_deletion_queue ON member_deletion_requests(state,requested_at);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0006_account_privacy');
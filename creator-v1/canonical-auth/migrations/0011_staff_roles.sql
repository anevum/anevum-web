-- ANEVUM.IREN.BUILD.2026-10-17.002.APEX-STAFF-ACTIVATION
-- Apply to canonical MEMBER_DB only, AFTER 0010_staff_command.sql.
-- No account is granted staff status by this schema alone.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS staff_access_grants (
 member_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('owner','reviewer')),
 granted_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS staff_access_active
 ON staff_access_grants(role,member_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS staff_access_audit (
 id TEXT PRIMARY KEY NOT NULL,
 actor_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 member_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 action TEXT NOT NULL CHECK(action IN ('bootstrap-owner','grant-reviewer','revoke-reviewer')),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_access_audit_recent
 ON staff_access_audit(created_at DESC,id DESC);

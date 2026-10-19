-- ANEVUM IREN OBSERVATORY 2026-10-19
-- Apply once to canonical member D1. Audit only; no XP or member changes.
CREATE TABLE IF NOT EXISTS anevum_staff_management_audit (
 id TEXT PRIMARY KEY NOT NULL,
 actor_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 member_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 action TEXT NOT NULL CHECK (action IN ('aura-set')),
 old_value TEXT NOT NULL,
 new_value TEXT NOT NULL,
 created_at INTEGER NOT NULL CHECK(created_at > 0)
);
CREATE INDEX IF NOT EXISTS idx_anevum_staff_management_audit_actor_time
 ON anevum_staff_management_audit(actor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anevum_staff_management_audit_member_time
 ON anevum_staff_management_audit(member_id,created_at DESC);

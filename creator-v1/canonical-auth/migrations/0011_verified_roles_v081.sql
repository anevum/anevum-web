-- ANEVUM.WEB.BUILD.2026-10-18.002.EMBLEM-AURAS-REPUTATION
-- Source-only additive migration for canonical MEMBER_DB. Require backup,
-- reviewer signoff and separate migration approval before applying.
-- This registry grants display distinctions only, NEVER staff access rights.
CREATE TABLE IF NOT EXISTS member_role_grants (
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('founder','administrator','moderator','curator')),
 granted_at INTEGER NOT NULL CHECK(granted_at>0),
 granted_by TEXT NOT NULL CHECK(length(granted_by)>0),
 reviewed_by TEXT NOT NULL CHECK(length(reviewed_by)>0 AND reviewed_by<>granted_by),
 evidence_ref TEXT NOT NULL CHECK(length(evidence_ref)>0),
 revoked_at INTEGER,
 PRIMARY KEY(user_id,role),
 CHECK(revoked_at IS NULL OR revoked_at>=granted_at)
);
CREATE INDEX IF NOT EXISTS member_role_grants_active ON member_role_grants(user_id,role)
 WHERE revoked_at IS NULL;
-- No accounts are auto-labeled as founder or moderator by email address.
-- A separately audited, restricted operator must issue role evidence.
-- Revocation removes the visible designation on the next server read.

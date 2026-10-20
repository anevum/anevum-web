-- ANEVUM.IREN.BUILD.2026-10-19.001.VERIFIED-ROLE-APPROVALS
-- Source-only, additive *display-designation* workflow. NOT DEPLOYED.
-- Apply only to canonical MEMBER_DB after separate backup, schema review,
-- staged rehearsal, and explicit production change approval.
-- This single migration contains the low-read-cost role ledger previously
-- proposed in 0011_verified_roles_v081.sql, WITHOUT that file's forum index
-- scans. Do not apply the 0011 reputation indexes merely to enable roles.
-- No member is auto-granted a role. No staff privilege is created.
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

-- A proposed mark is not a mark, and never appears in a public projection.
CREATE TABLE IF NOT EXISTS member_role_requests (
 id TEXT PRIMARY KEY NOT NULL,
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('founder','administrator','moderator','curator')),
 evidence_ref TEXT NOT NULL CHECK(length(evidence_ref) BETWEEN 25 AND 240),
 nominated_by TEXT NOT NULL REFERENCES "user"(id),
 nominated_at INTEGER NOT NULL CHECK(nominated_at>0),
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','rejected')),
 reviewed_by TEXT REFERENCES "user"(id),
 reviewed_at INTEGER,
 CHECK(
  (state='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
  OR (state<>'pending' AND reviewed_by IS NOT NULL
   AND reviewed_by<>nominated_by AND reviewed_by<>member_id
   AND reviewed_at IS NOT NULL AND reviewed_at>=nominated_at)
 )
);
CREATE UNIQUE INDEX IF NOT EXISTS member_role_requests_one_pending
 ON member_role_requests(member_id,role) WHERE state='pending';
CREATE INDEX IF NOT EXISTS member_role_requests_queue
 ON member_role_requests(state,nominated_at DESC);
CREATE INDEX IF NOT EXISTS member_role_requests_nominator_hour
 ON member_role_requests(nominated_by,nominated_at DESC);

-- Append-only issuance/denial/revocation history. A revoked or reissued
-- designation must retain its prior evidence and decision trail.
CREATE TABLE IF NOT EXISTS member_role_events (
 id TEXT PRIMARY KEY NOT NULL,
 request_id TEXT UNIQUE REFERENCES member_role_requests(id),
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('founder','administrator','moderator','curator')),
 action TEXT NOT NULL CHECK(action IN ('approved','rejected','revoked')),
 actor_id TEXT NOT NULL REFERENCES "user"(id),
 happened_at INTEGER NOT NULL CHECK(happened_at>0)
);
CREATE INDEX IF NOT EXISTS member_role_events_member
 ON member_role_events(member_id,happened_at DESC);
CREATE INDEX IF NOT EXISTS member_role_events_actor_hour
 ON member_role_events(actor_id,happened_at DESC);

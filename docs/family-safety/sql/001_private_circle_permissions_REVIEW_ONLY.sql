-- ANEVUM Family Safety — PRIVATE CIRCLE PERMISSIONS (REVIEW ONLY)
-- Session: ANEVUM.ANEVUM.BUILD.2026-10-17.002.CIRCLE-PRIVACY-FOUNDATION
--
-- Not deployed. Do not place in automatic production/Creator V1 migrations.
-- Requires its OWN isolated D1 database/binding and verified family identity.
-- There are intentionally NO latitude, longitude, GPS trails, school destinations,
-- real names, addresses, public profiles, or child records in these tables.
-- Runtime must enable PRAGMA foreign_keys=ON per connection where supported.
-- Runtime MUST re-evaluate the JS policy kernel before EACH protected read/write.
--
-- Initial R1 scope: independently verified adult participants ONLY. A future
-- release requires child safety/legal/custody and guardian enrollment review.

CREATE TABLE IF NOT EXISTS fs_private_circles (
  circle_id TEXT PRIMARY KEY NOT NULL,
  owner_subject_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','disabled','closed')),
  created_at_ms INTEGER NOT NULL CHECK(created_at_ms > 0)
);

CREATE TABLE IF NOT EXISTS fs_memberships (
  circle_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('adult','guardian')),
  age_band TEXT NOT NULL CHECK(age_band = 'adult'),
  identity_verified INTEGER NOT NULL DEFAULT 0 CHECK(identity_verified IN (0,1)),
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK(state IN ('pending','active','revoked')),
  joined_at_ms INTEGER NOT NULL CHECK(joined_at_ms > 0),
  PRIMARY KEY(circle_id,subject_id),
  FOREIGN KEY(circle_id) REFERENCES fs_private_circles(circle_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fs_share_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  circle_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  consent TEXT NOT NULL CHECK(consent = 'explicit'),
  state TEXT NOT NULL CHECK(state IN ('active','expired','revoked')),
  started_at_ms INTEGER NOT NULL CHECK(started_at_ms > 0),
  expires_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  CHECK (expires_at_ms >= started_at_ms + 60000),
  CHECK (expires_at_ms <= started_at_ms + 3600000),
  CHECK (revoked_at_ms IS NULL OR revoked_at_ms >= started_at_ms),
  UNIQUE(session_id,circle_id,subject_id),
  FOREIGN KEY(circle_id,subject_id)
    REFERENCES fs_memberships(circle_id,subject_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fs_viewer_grants (
  grant_id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  circle_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  viewer_id TEXT NOT NULL,
  consent TEXT NOT NULL CHECK(consent = 'explicit'),
  scope TEXT NOT NULL CHECK(scope = 'presence:read'),
  state TEXT NOT NULL CHECK(state IN ('active','expired','revoked')),
  issued_at_ms INTEGER NOT NULL CHECK(issued_at_ms > 0),
  expires_at_ms INTEGER NOT NULL CHECK(expires_at_ms > issued_at_ms),
  revoked_at_ms INTEGER,
  CHECK(viewer_id <> subject_id),
  CHECK(revoked_at_ms IS NULL OR revoked_at_ms >= issued_at_ms),
  FOREIGN KEY(session_id,circle_id,subject_id)
    REFERENCES fs_share_sessions(session_id,circle_id,subject_id)
    ON DELETE CASCADE,
  FOREIGN KEY(circle_id,viewer_id)
    REFERENCES fs_memberships(circle_id,subject_id) ON DELETE CASCADE
);

-- Immutable audit events must contain no coordinates or complete message bodies.
-- Audit access and retention need a restricted, independently administered policy.
CREATE TABLE IF NOT EXISTS fs_access_audit (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id TEXT NOT NULL,
  actor_subject_id TEXT,
  target_subject_id TEXT,
  action TEXT NOT NULL CHECK(action IN (
    'grant_created','grant_revoked','session_started','session_stopped',
    'location_read_allowed','location_read_denied','position_write_rejected'
  )),
  occurred_at_ms INTEGER NOT NULL CHECK(occurred_at_ms > 0),
  request_correlation_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_fs_membership_subject
  ON fs_memberships(subject_id,state);
CREATE INDEX IF NOT EXISTS ix_fs_sessions_expiry
  ON fs_share_sessions(circle_id,subject_id,state,expires_at_ms);
CREATE INDEX IF NOT EXISTS ix_fs_viewer_grants
  ON fs_viewer_grants(circle_id,viewer_id,subject_id,state,expires_at_ms);
CREATE INDEX IF NOT EXISTS ix_fs_audit_expiry
  ON fs_access_audit(occurred_at_ms);

-- IMPORTANT: DB FKs/checks do not verify actor identity, current consent,
-- grant age relative to its session, or revocation propagation by themselves.
-- These are enforced by the server-side policy on EVERY read/write/stream.
-- No table here is authorized for direct public exposure.

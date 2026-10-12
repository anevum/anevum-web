-- STAGING ONLY: ANEVUM identity prototype. NOT an alternative to an audited auth platform.
-- Apply only to anevum-creator-v1-staging, never V5 or production.
CREATE TABLE IF NOT EXISTS member_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  verified_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deleted')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_accounts_status ON member_accounts(status);

CREATE TABLE IF NOT EXISTS member_email_challenges (
  email_key TEXT PRIMARY KEY NOT NULL,
  code_hash TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_challenges_expiry ON member_email_challenges(expires_at);

CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_member_sessions_member ON member_sessions(member_id,expires_at);

CREATE TABLE IF NOT EXISTS member_request_limits (
  key TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  requests INTEGER NOT NULL CHECK(requests >= 1)
);
CREATE INDEX IF NOT EXISTS idx_member_limits_window ON member_request_limits(window_start);

INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0003_member_identity_staging');
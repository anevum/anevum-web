-- V5 review-only Alpaca OAuth (paper account, read-only access assumed).
-- THIS IS NOT the obsolete Commons #249/#252 migration sequence.
-- 0004_member_rhen_workspaces.sql must be registered first on preview D1.
-- No production migration, live trading, broker order, or payment capability.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_alpaca_review_states (
  state_hash TEXT PRIMARY KEY NOT NULL CHECK(length(state_hash)=64),
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS member_alpaca_review_states_owner
  ON member_alpaca_review_states(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS member_alpaca_review_consent (
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  disclosure_version TEXT NOT NULL CHECK(length(disclosure_version) BETWEEN 8 AND 64),
  accepted_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, disclosure_version)
);

CREATE TABLE IF NOT EXISTS member_alpaca_review_connections (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  connection_id TEXT NOT NULL UNIQUE,
  broker_account_id TEXT NOT NULL UNIQUE,
  encrypted_token TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  granted_scopes TEXT NOT NULL
    CHECK(instr(' ' || granted_scopes || ' ', ' trading ') = 0)
    CHECK(instr(' ' || granted_scopes || ' ', ' account:write ') = 0),
  environment TEXT NOT NULL DEFAULT 'paper' CHECK(environment='paper'),
  connected_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS member_alpaca_review_connection_owner
  ON member_alpaca_review_connections(user_id, connected_at DESC);

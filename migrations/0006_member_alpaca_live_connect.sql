-- RHEN Cloud: owner-independent ANEVUM member Alpaca Connect LIVE OAuth.
-- This is identity/credential linkage, NOT an order authorization or trading balance.
-- Never share the company's trading runtime database or authorize broker orders here.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_alpaca_live_oauth_states (
    state_hash TEXT PRIMARY KEY NOT NULL CHECK(length(state_hash)=64),
    user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS member_alpaca_live_state_owner_idx
    ON member_alpaca_live_oauth_states(user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS member_alpaca_live_connections (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    connection_id TEXT NOT NULL UNIQUE,
    broker_account_id TEXT NOT NULL UNIQUE,
    -- Ciphertext is AES-256-GCM encrypted server-side, bound to (user, connection, broker, env).
    encrypted_token TEXT NOT NULL,
    token_iv TEXT NOT NULL,
    granted_scopes TEXT NOT NULL CHECK(instr(' ' || granted_scopes || ' ', ' trading ') > 0),
    environment TEXT NOT NULL DEFAULT 'live' CHECK(environment='live'),
    connected_at INTEGER NOT NULL,
    revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS member_alpaca_live_connection_owner_idx
    ON member_alpaca_live_connections(user_id, connected_at DESC);

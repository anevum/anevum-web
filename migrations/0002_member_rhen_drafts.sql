-- A member-owned RHEN configuration draft, not a trading account.
-- Contains no broker tokens, permissions, orders, trading state, or reward balances.
-- The server supplies the authenticated user_id; clients cannot select an owner.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_rhen_drafts (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 48),
  market_scope TEXT NOT NULL DEFAULT 'us_equities_etfs'
    CHECK (market_scope = 'us_equities_etfs'),
  direction TEXT NOT NULL DEFAULT 'long_only'
    CHECK (direction = 'long_only'),
  max_open_positions INTEGER NOT NULL
    CHECK (max_open_positions BETWEEN 1 AND 10),
  max_total_exposure_percent INTEGER NOT NULL
    CHECK (max_total_exposure_percent BETWEEN 1 AND 100),
  max_position_percent INTEGER NOT NULL
    CHECK (max_position_percent BETWEEN 1 AND 100 AND
           max_position_percent <= max_total_exposure_percent),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

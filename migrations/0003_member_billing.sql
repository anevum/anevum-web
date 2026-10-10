-- RHEN Cloud commercial billing only. Never conveys broker, order, operator,
-- fund-transfer, research-promotion, or paper/live execution authority.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_billing_customers (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member_billing_subscriptions (
  stripe_subscription_id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan_code TEXT NOT NULL CHECK(plan_code IN ('founding','standard','unknown')),
  status TEXT NOT NULL,
  current_period_end INTEGER NOT NULL DEFAULT 0,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK(cancel_at_period_end IN (0,1)),
  source_checked_at_ms INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (stripe_customer_id) REFERENCES member_billing_customers(stripe_customer_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS member_billing_by_user_idx ON member_billing_subscriptions(user_id, status);

CREATE TABLE IF NOT EXISTS member_billing_events (
  stripe_event_id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dedicated short-lived D1 mutex prevents concurrent Checkout creation for one user.
-- Never store Stripe tokens, card data or broker credentials in this table.
CREATE TABLE IF NOT EXISTS member_billing_checkout_locks (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  lock_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS member_billing_sync_state (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 last_attempt_ms INTEGER NOT NULL DEFAULT 0,
 last_success_ms INTEGER NOT NULL DEFAULT 0
);

-- Free, opt-in prerelease interest only. No paid or execution entitlements.
CREATE TABLE IF NOT EXISTS member_rhen_beta_waitlist (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

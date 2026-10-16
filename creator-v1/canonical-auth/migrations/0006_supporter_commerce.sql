-- ANEVUM.WEB.BUILD.2026-10-16.001.SUPPORTER-REVENUE
-- Isolated canonical staging MEMBER_DB only. No deployment or live Stripe data.
-- Requires canonical identity migration 0001. Never apply to V5/Creator legacy D1.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS supporter_checkout_intents(
  stripe_checkout_session_id TEXT PRIMARY KEY NOT NULL,
  member_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at_ms INTEGER NOT NULL,
  completed_at_ms INTEGER,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT
);
CREATE INDEX IF NOT EXISTS supporter_checkout_member_idx
 ON supporter_checkout_intents(member_user_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS supporter_customers(
  member_user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS supporter_subscriptions(
  stripe_subscription_id TEXT PRIMARY KEY NOT NULL,
  member_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL REFERENCES supporter_customers(stripe_customer_id),
  stripe_price_id TEXT NOT NULL,
  billing_interval TEXT NOT NULL CHECK(billing_interval IN ('month','year')),
  status TEXT NOT NULL CHECK(status IN ('active','trialing','incomplete','incomplete_expired','past_due','canceled','unpaid','paused')),
  current_period_end_ms INTEGER NOT NULL CHECK(current_period_end_ms>0),
  cancel_at_period_end INTEGER NOT NULL CHECK(cancel_at_period_end IN (0,1)),
  synced_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS supporter_subscription_owner_idx
 ON supporter_subscriptions(member_user_id,synced_at_ms DESC);

CREATE TABLE IF NOT EXISTS supporter_webhook_events(
  stripe_event_id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  stripe_created_sec INTEGER NOT NULL,
  processed_at_ms INTEGER NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('synced','ignored'))
);

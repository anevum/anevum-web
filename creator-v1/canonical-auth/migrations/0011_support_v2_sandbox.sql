-- ANEVUM.WEB.BUILD.2026-10-24.001.SUPPORTER-PAYMENT-RAIL
-- ADDITIVE ONLY: isolated canonical MEMBER_DB staging sandbox.
-- No application of this schema to V5, live billing, or archived Stripe tables.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS support_v2_checkout_guards (
 member_user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 intent_id TEXT NOT NULL UNIQUE,
 expires_at_ms INTEGER NOT NULL,
 created_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS support_v2_intents (
 id TEXT PRIMARY KEY NOT NULL,
 member_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 interval TEXT NOT NULL CHECK(interval IN ('month','year')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents IN (500,3600)),
 currency TEXT NOT NULL CHECK(currency='USD'),
 provider TEXT NOT NULL CHECK(provider='square_sandbox'),
 state TEXT NOT NULL CHECK(state IN ('creating','ready','paid','review')),
 square_order_id TEXT UNIQUE,
 square_payment_link_id TEXT UNIQUE,
 checkout_url TEXT,
 created_at_ms INTEGER NOT NULL,
 updated_at_ms INTEGER NOT NULL,
 last_reconciled_at_ms INTEGER NOT NULL DEFAULT 0,
 CHECK((interval='month' AND amount_cents=500) OR (interval='year' AND amount_cents=3600))
);
CREATE INDEX IF NOT EXISTS support_v2_intent_member_idx ON support_v2_intents(member_user_id,created_at_ms DESC);

CREATE TABLE IF NOT EXISTS support_v2_payments (
 payment_id TEXT PRIMARY KEY NOT NULL,
 intent_id TEXT NOT NULL UNIQUE REFERENCES support_v2_intents(id),
 member_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 customer_id TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents IN (500,3600)),
 currency TEXT NOT NULL CHECK(currency='USD'),
 provider_status TEXT NOT NULL CHECK(provider_status='COMPLETED'),
 verified_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS support_v2_payment_member_idx ON support_v2_payments(member_user_id,verified_at_ms DESC);

CREATE TABLE IF NOT EXISTS support_v2_memberships (
 member_user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 square_subscription_id TEXT NOT NULL UNIQUE,
 square_customer_id TEXT NOT NULL UNIQUE,
 intent_id TEXT NOT NULL UNIQUE REFERENCES support_v2_intents(id),
 interval TEXT NOT NULL CHECK(interval IN ('month','year')),
 provider_status TEXT NOT NULL,
 paid_until_date TEXT NOT NULL,
 canceled_date TEXT,
 verified_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS support_v2_payment_holds (
 payment_id TEXT PRIMARY KEY NOT NULL,
 reason TEXT NOT NULL CHECK(reason IN ('refund','dispute')),
 event_id TEXT NOT NULL,
 created_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS support_v2_webhook_events (
 event_id TEXT PRIMARY KEY NOT NULL,
 event_type TEXT NOT NULL,
 processed_at_ms INTEGER NOT NULL,
 outcome TEXT NOT NULL CHECK(outcome IN ('recorded','ignored'))
);

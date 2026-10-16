# ANEVUM / CONTINUANCE INSTITUTE — SUPPORTER REVENUE V032

Session: ANEVUM.WEB.BUILD.2026-10-16.001.SUPPORTER-REVENUE
Source: V031 verified staging branch at f3d5ba451472ba978ac53243eb7f0cbcceeff194
Status: SOURCE CANDIDATE ONLY / NO LIVE COMMERCE

## Non-negotiable product contract
ANEVUM remains free to join, browse, submit and participate, subject to safety and resource quotas. Earned XP, all 60 levels, awards and merit recognition must never be bought. No mandatory ads, sponsored feed inserts, pay-to-win, paid moderation privileges or paid search ranking. Supporters buy optional recognition and well-defined extras, not special status or influence.

## First commercial offering
Working name: ANEVUM Founding Supporter. Proposed, not approved for live sale:
- US$5 monthly or US$36 yearly, customer selects recurring interval with transparent renewal and cancellation disclosure.
- Visual orbital insignia on profile, supporter account label and later optional aesthetic profile treatments with a published delivery schedule.
- Do not sell benefits that do not exist yet as if delivered; clearly mark planned benefits.
- No extra XP, levels, medals, moderation power, recommendation priority or privileged access to essential creation.
- No supporter checkout until billing, identity and policy gates pass.

The stronger near-term revenue path is a tangible ANEVUM creative service or finished digital product sold with a one-time Stripe Payment Link, with scope, fulfillment, refunds and tax obligations reviewed separately. Supporter memberships alone will not rapidly replace household income without an audience.

## Architecture
Browser -> authenticated Cloudflare Worker -> Stripe hosted Checkout (server-owned allowlisted Price ID, metadata member ID, idempotency key) -> Stripe.
Verified Stripe webhooks -> event inbox (durable deduplication by event ID) -> Stripe API subscription retrieval -> MEMBER_DB subscription projection -> authenticated entitlement endpoint -> optional supporter badge on wall.
Browser -> authenticated Cloudflare Worker -> Stripe Customer Portal -> Stripe (cancel/change card) -> verified webhooks refresh entitlements.
Never put Stripe secret keys in frontend JS, git, PR descriptions, or public logs. Never derive entitlement from checkout return URL or from raw user metadata. Never accept client-selected amount/Price ID, customer ID or member ID. Map customer ID to authenticated member on server with unique constraints. Require signed webhook raw body and replay tolerance; run side effects exactly once via transactional inbox. Account-link reconciliation, chargebacks, disputes, taxes, and refund effects require dedicated tests.

## Persistence candidate (not applied)
- supporter_customers(member_user_id PRIMARY KEY REFERENCES user(id), stripe_customer_id UNIQUE NOT NULL, created_at)
- supporter_subscriptions(stripe_subscription_id PRIMARY KEY, member_user_id REFERENCES user(id), stripe_customer_id, status, current_period_end_ms, stripe_price_id, updated_at)
- supporter_webhook_events(stripe_event_id PRIMARY KEY, type, created_at, processed_at, outcome)
Do not perform D1 migrations without migration backup and exact canonical identity schema inspection. Bind in canonical staging MEMBER_DB only, never the legacy community D1.

## Launch / safety gates
1. Merchant account verification, statement descriptor, verified legal entity / payout details, tax treatment and support contact. Stripe connection alone is not confirmation of readiness.
2. Inspect V031 canonical worker routes, auth cookie handling, CSRF and private account isolation; implement session-resolution reuse, no cross-identity joins.
3. Configure two Stripe recurring Prices only in test/sandbox first. Live account connection is NOT authorization to create live offers or charge customers.
4. Add authenticated server checkout and portal handlers; customer creation must be idempotent per member.
5. Add signed raw webhook verification, durable event deduplication, out-of-order reconciliation, missing invoice recovery, subscription cancellation and refund/chargeback policy.
6. Add schema, server state tests, browser end-to-end acceptance and Stripe test-clock lifecycle tests, including membership renewal, cancel at period end, failed payment, chargeback and webhook reordering.
7. Add public pricing/terms/privacy/refund/cancellation disclosures and user support path. Disclose tax if applicable.
8. Confirm no PII in public profiles and badge removal upon loss of entitlement. Never grant XP through billing.
9. Owner accepts final creative copy, pricing, commercial obligations and explicitly authorizes live Stripe products, keys, checkout and staging deployment.
10. Keep anevum.com launch countdown unchanged and no promotion of a.anevum.com to production before owner approval.

## Infrastructure cost containment
Railway inventory as of October 16: ANEVUM Core has a staging evidence-probe service; RHEN project has zero current services. This does not establish current bills. Inspect all accounts, including RHEN Archive, current cost graph and invoices before deleting anything. Avoid new compute, cron, queues or paid products for this release. Prefer existing Cloudflare Worker and D1 allocations. Establish cash runway as (cash accessible to business minus committed bills) / unavoidable monthly cash outflow; do not count Alpaca trading profits, prospective supporter sales or unreceived payouts.

## Implementation checkpoint
V032 currently supplies a self-contained deterministic entitlement projection and tests only. It does NOT accept money, listen to webhooks, confer live badges or change existing routes. Must not be described as a live integration.

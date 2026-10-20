# ANEVUM / FOUNDING SUPPORTER
## V035 Controlled Launch Runbook — TEST MODE BEFORE LIVE MONEY
Session: ANEVUM.WEB.BUILD.2026-10-16.004.SUPPORTER-PAYMENT-RECOVERY
Status: SOURCE ONLY / OWNER RELEASE AUTHORIZATION REQUIRED
Date: October 16, 2026

### Verified environment
- Connected Stripe account ANEVUM has live product prod_VS8dsmuyKtbxBe, live monthly price_1UREMnDru8RvRNYoGgRoBzEg and live annual price_1UREMpDru8RvRNYolKA3U5lU. ALL ARE INACTIVE.
- All three Stripe connections currently list that account in LIVE mode only. A separate TEST/Sandbox connection is not currently available.
- Cloudflare deployed Worker: anevum-creator-v1-a-staging, canonical MEMBER_DB: anevum-canonical-member-staging (e1d29049-c83b-4534-8355-dc1fa36ba6d8).
- Read-only Cloudflare inspection found user, member_creator_profiles and canonical_identity_manifest, but NO supporter_* tables; Worker settings listed NO CANONICAL_STRIPE_* secrets; scheduled triggers were empty.
- V035 is source only and builds on V034 and V032 draft PRs. The public anevum.com January 1 countdown is separate and untouched.

### Stripe test-mode setup
1. Open https://dashboard.stripe.com and select ANEVUM.
2. Create or open a Stripe TEST/Sandbox environment. Do not create another live business account just to test.
3. Create an active TEST Founding Supporter product with an active TEST $5/month Price and active TEST $36/year Price. Validate USD 500/3600 cents, interval_count=1, recurring, active state. Never use the inactive LIVE Price IDs as test IDs.
4. Provision the TEST API key and webhook signing secret in secure secret storage, never in git, chat, screenshots or frontend JavaScript.
5. Once an owner-approved staging deployment exists, configure the TEST webhook endpoint at https://a.anevum.com/api/v1/member/supporter/webhook.
6. Deliver and verify checkout.session.completed, checkout.session.async_payment_succeeded, customer.subscription.created/updated/deleted, invoice.paid/payment_failed, refund.created/updated, charge.refunded and charge.dispute.created. Check retries, replay, duplicate events and out-of-order settlement.

### Cloudflare staging release checklist (requires owner authorization)
1. Confirm exact reviewed source SHA, CI, registration route and final disclosures.
2. Take and verify a restorable backup/export of the exact MEMBER_DB BEFORE changing schema. Verify the issuer marker and database ID. Never change COMMUNITY_DB, RHEN or legacy databases.
3. Review additive migration creator-v1/canonical-auth/migrations/0006_supporter_commerce.sql and apply only to canonical MEMBER_DB after owner approval.
4. Verify all required tables and no change to sessions, member earned XP, awards or walls.
5. Deploy the approved candidate to existing staging Worker with CANONICAL_SUPPORTER_COMMERCE_ENABLED=false first, verify current site before enabling Stripe.
6. Bind TEST secrets and TEST monthly/annual Price IDs into the staging Worker. Do not bind the inactive LIVE IDs.
7. Verify scheduled 05:17 UTC reconciliation and TEST webhook retries on the actual Worker.
8. Enable TEST commerce only after all test-mode configuration and schema are independently verified.
9. Test all states (new supporter, cancellation, refund, dispute, resubscription, stale Stripe status), cross-account isolation, public recognition consent and private member data export on desktop and a real phone.
10. Finish privacy, account deletion, support escalation, tax and refund policies.
11. Separate explicit owner approval is required to activate LIVE Stripe prices and charge real customers. Current code rejects sk_live keys; live checkout would require a separate audited release.

### V035 recovery behavior
- Every new TEST Stripe Checkout explicitly expires in 30 minutes; an ambiguous API/database failure holds the checkout creation lease for two hours.
- Retrying an OPEN existing session, regardless of local age, uses Stripe's verified session URL. A confirmed expired/unpaid session is marked abandoned before a new one can be created.
- New sessions use per-attempt nonce idempotency rather than an hour-derived fixed key.
- Signed webhook, owner account status check (throttled) and daily scheduled job all repair verified paid Checkout sessions without creating a payment.
- Deferred payments do not unlock paid perks until Stripe confirms paid.
- Checkout owner, subscription ID, Stripe customer and exact monthly/yearly interval must match before entitlements are granted.
- User data exports include the member's own billing/cosmetic details, no card numbers/secrets and no other member account data.
- A daily source Cron checks at most 40 subscriptions and 40 incomplete Checkout intents. Scalable paging and operational monitoring are required before growth.

### Remaining gates
- Test-mode Stripe access and real signed webhook acceptance.
- Approved refund, tax, billing/cancellation terms and verified customer support route.
- Safe account deletion that closes live subscriptions before removing an identity; this is not currently built.
- Unrelated payment/refund identification before sharing the same Stripe Customer with other future products.
- Backup + staging schema deployment + mobile QA.
- Final owner deployment and LIVE payment activation authorization.

No additional Railway services, paid media or monthly development packages are part of this change.

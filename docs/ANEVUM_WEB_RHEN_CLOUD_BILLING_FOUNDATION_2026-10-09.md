# ANEVUM.WEB.BUILD.2026-10-09.001.RHEN-CLOUD-BILLING-FOUNDATION

**State:** Development branch / production-preparation only. No Stripe product, checkout, paid-member execution, or live-member brokerage rollout is authorized or represented as active.

## Product decisions

- ANEVUM public site, account creation, research, updates, and baseline member experience remain free.
- Proposed RHEN Cloud founding monthly price is **$9.99 USD**; standard monthly price is **$19.99 USD**. No annual plan, performance fee, withdrawal fee, commission or guarantees are introduced.
- Never sell membership as a share in the owner/company's brokerage account.
- Subscriber eligibility must never bypass the owner's private Cloudflare Access session, RHEN account isolation, broker approvals, or per-account execution gates.
- Billing is separate from member RHEN drafts, from GRAEN/VELUM research, and from production order-write authority.
- The founding price is a release-controlled offer, NOT a claim that its capacity limit is implemented. Keep `ANEVUM_RHEN_FOUNDING_ENABLED=false` until invitations/capacity enforcement are separately approved.

## Implemented billing foundation

### Database: `migrations/0003_member_billing.sql`

- `member_billing_customers` maps one Better Auth user to a Stripe customer. Unique customer id and user id.
- `member_billing_subscriptions` records normalized Stripe subscription state and current paid period; foreign keys to both user and customer. Unknown prices never confer entitlement.
- `member_billing_events` stores webhook event identifiers for repeat-delivery recognition.
- All subscription/user/customer queries are explicitly scoped. Cascade on user deletion removes local billing records only **after** the provider cancellation callback succeeds.

### API

- `GET /api/member/billing`: authenticated subscriber status, pricing proposal, billing feature gates and paid-only entitlement. Always reports `paperExecutionEnabled:false` and `liveExecutionEnabled:false`.
- `POST /api/member/billing/checkout`: authenticated and same-origin, verified-email member; accepts only `{ "plan": "founding" | "standard" }` and no price/customer/id override. Enabled only with test-mode configuration and explicit staging flags or separately approved live production. Price is fetched from Stripe and must match USD 9.99/19.99 per month before Checkout creation.
- `POST /api/member/billing/portal`: authenticated billing customer opens Stripe's hosted management portal, using the server-owned customer mapping. The portal remains usable when new checkout is closed, provided safe Stripe settings remain configured.
- `POST /api/billing/stripe/webhook`: raw-body HMAC-SHA256 Stripe signature, freshness tolerance, account mode and event shape verification. Accepts subscription-created/updated/deleted events, retrieves Stripe's latest canonical subscription, verifies mapped customer and member metadata, then updates D1. Duplicate and delayed events cannot by themselves revive canceled access. Unknown customer and prices never grant paid access.
- Existing `/api/member/export` now includes billing records for that user. Existing Better Auth `beforeDelete` callback attempts to expire open Stripe Checkout sessions and cancel open provider subscriptions before allowing identity deletion; a failed provider operation prevents silent orphan charging.
- No member-to-RHEN order or credential route is introduced.

### UI

- `/me/billing`: subscription status, proposed pricing, access/manage controls when configured, warning that checkout return is not verified payment, explicit message that brokerage and trading remain unavailable.
- Entry links in Command and member account settings.
- Subscription access and member execution remain explicitly different permissions.

## Environment variables and secrets

Both checked-in Wrangler deployment configurations set:
- `ANEVUM_RHEN_BILLING_ENABLED=false`
- `ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED=false`
- `ANEVUM_RHEN_BILLING_WEBHOOKS_ENABLED=false`
- `ANEVUM_RHEN_FOUNDING_ENABLED=false`
- `ANEVUM_RHEN_BILLING_LIVE_APPROVED=false`

Production mode is `ANEVUM_STRIPE_MODE=disabled` until explicit live approval; staging uses `ANEVUM_STRIPE_MODE=test` but the three functional billing flags still default to OFF.

Set these ONLY as secure Cloudflare Worker bindings, separately per environment:
- `STRIPE_SECRET_KEY` (`sk_test_...` only on staging, `sk_live_...` only for approved production)
- `STRIPE_WEBHOOK_SECRET` (a separate `whsec_...` per Stripe webhook destination)
- `STRIPE_FOUNDING_PRICE_ID` and `STRIPE_STANDARD_PRICE_ID` (IDs for recurring USD monthly prices; not secret but configure per environment, never client-supplied)

Never paste secret keys, webhook signing secrets, session cookies, member credentials or payment data into GitHub, ChatGPT, browser query strings, or runtime logs.

## Separate staging acceptance

1. Merge after CI review. The main-branch preview-only migration workflow targets `anevum-members-preview` and must verify three billing tables, ten pre-existing tables and FK integrity.
2. In Stripe **test mode**, create one RHEN Cloud product with separate $9.99 and $19.99 USD recurring monthly prices, and configure Stripe Customer Portal. Do not use live prices in staging.
3. Configure a Stripe test webhook destination `https://anevum-member-staging.devonakins.workers.dev/api/billing/stripe/webhook` for `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Save that destination's signing secret as a staging Worker **Secret**.
4. Configure all staging Stripe bindings, activate billing + webhook + (optionally standard checkout) staging flags only.
5. With two independent authenticated test members, exercise valid/invalid same-origin checkout, wrong plan/extra input, price mismatch, duplicate/out-of-order webhooks, missed webhook replay/reconciliation, payment failure, cancelled renewal, expired period, customer mapping mismatch, portal access, deletion with open checkout/subscription, user cross-access, nonmember 401, and owner operator access unchanged.
6. Inspect Stripe test mode for zero orphan subscriptions after deletion. Record results without payment-card data or secrets.
7. Keep founding enablement OFF until a durable invite/quantity cap and eligibility controls exist.

## Production release gates (distinct from schema readiness)

1. Actual Stripe connection must be accessible; payment settings/product/price IDs and mode verified against an authenticated Stripe account. API tool connection returning an invalid link ID is **not** acceptance.
2. Payment terms, refund/cancellation policy, privacy/retention, sales tax and consumer disclosures must be reviewed against real flows; do not claim existing October 8 privacy/terms approval covers payment data.
3. Obtain brokerage and securities regulatory review before proposing automated investing subscriptions or live execution. Alpaca third-party commercial OAuth/live trading approval is separate.
4. Verify real workload economics, billing rate limits, failure mode/incident procedures, operational support, subscriber cancellation and reconciliation before collecting funds.
5. Perform an affirmative, manual **schema-only** production D1 migration using `.github/workflows/member-billing-production-d1-migrate.yml`. This requires owner approval, ten existing member tables and production checkout flags OFF. No billing activation follows automatically.
6. Only after live Stripe setup, production legal/compliance, two-user billing security acceptance and owner release authorization, set appropriate live Stripe secrets and `ANEVUM_STRIPE_MODE=live` with separately approved production flags. Never reuse staging Stripe keys.
7. Do not enable member broker connectivity, paper execution, live trading, transfers, premium returns, or automatic strategy promotion because billing is online. Those require independent feature releases.

## RHEN multi-account execution: separate workload

The existing Railway `rhen` supervisor is a single tenant, with one volume and one primary live broker credential pair. No website billing change may fan out orders through that process. Next implementation must design and test stateless tenant execution workers and durable per-account state, broker token isolation, independent budgets, idempotency, order reconciliation, queue fairness, audit trails, secure credential storage, per-member lifecycle, and failure isolation. Validate all behavior on paper accounts before proposing a live-member pilot.

**Rollback:** turn off checkout first; preserve billing portal and webhook reconciliation for existing subscriptions; never assume switching off billing flags cancels Stripe subscriptions. Failures involving existing subscribers require explicit provider-side cancellation and notices rather than orphan charging.

# ANEVUM.WEB.BUILD.2026-10-09.001.RHEN-CLOUD-BILLING-FOUNDATION

**State:** Development branch / production-preparation only. ANEVUM live-mode Stripe product and two prices exist but are **inactive**. No Checkout, paid-member execution, or live-member brokerage rollout is authorized or active.

## Product decisions

- ANEVUM public site, account creation, research, updates, and baseline member experience remain free.
- Proposed RHEN Cloud founding monthly price is **$2.99 USD**; standard monthly price is **$4.99 USD**. Free ANEVUM membership and free RHEN paper testing remain available during beta. No annual plan, performance fee, withdrawal fee, commission or guarantees are introduced.
- Never sell membership as a share in the owner/company's brokerage account.
- Subscriber eligibility must never bypass the owner's private Cloudflare Access session, RHEN account isolation, broker approvals, or per-account execution gates.
- Billing is separate from member RHEN drafts, from GRAEN/VELUM research, and from production order-write authority.
- These prices are low-cost, provisional early-adoption rates. $2.99 is NOT a verified marginal-cost floor for individual live-account execution; reevaluate measured cloud compute, licensed market data, API usage, support, payment failure/refund exposure, and regulated-service obligations before payment activation. Do not advertise returns or promises of profitability.
- The founding price is a release-controlled offer, NOT a claim that its capacity limit is implemented. Keep `ANEVUM_RHEN_FOUNDING_ENABLED=false` until invitations/capacity enforcement are separately approved.

## Implemented billing foundation

### Database: `migrations/0003_member_billing.sql`

- `member_billing_customers` maps one Better Auth user to a Stripe customer. Unique customer id and user id.
- `member_billing_subscriptions` records normalized Stripe subscription state and current paid period; foreign keys to both user and customer. Unknown prices never confer entitlement.
- `member_billing_events` stores webhook event identifiers for repeat-delivery recognition.
- `member_billing_checkout_locks` provides an expiring, token-checked D1 lock; provider-side open Checkout and subscription checks reduce duplicate purchases.
- `member_rhen_beta_waitlist` records free opt-in interest keyed only by the member identity; it does not authorize a paid, paper or live trading service.
- All subscription/user/customer queries are explicitly scoped. Cascade on user deletion removes local billing records only **after** the provider cancellation callback succeeds.

### API

- `GET /api/member/rhen/beta`, `POST /api/member/rhen/beta` and `DELETE /api/member/rhen/beta`: gated free waitlist status/join/withdrawal, verified email and same-origin mutation enforcement, no monetary or brokerage capability.
- `GET /api/member/billing`: authenticated subscriber status, pricing proposal, billing feature gates and paid-only entitlement. Always reports `paperExecutionEnabled:false` and `liveExecutionEnabled:false`.
- `POST /api/member/billing/checkout`: authenticated and same-origin, verified-email member; accepts only `{ "plan": "founding" | "standard" }` and no price/customer/id override. Enabled only with test-mode configuration and explicit staging flags or separately approved live production. Price is fetched from Stripe and must match USD 2.99/4.99 per month before Checkout creation.
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
- `ANEVUM_RHEN_BETA_WAITLIST_ENABLED=false`
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

1. Merge after CI review. The main-branch preview-only migration workflow targets `anevum-members-preview` and must verify five billing tables, ten pre-existing tables and FK integrity.
2. **Completed on the Stripe sandbox:** RHEN Cloud product, both $2.99 and $4.99 USD monthly prices, and a test customer portal. Do not use live-price IDs, live keys, or live charges in staging.
3. **Endpoint configured on the sandbox:** `https://anevum-member-staging.devonakins.workers.dev/api/billing/stripe/webhook` listens to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. **Still outstanding:** copy that sandbox endpoint's signing secret directly into staging Worker **Secrets**, without exposing it in repository files or chat.
4. Configure all staging Stripe bindings, activate billing + webhook + (optionally standard checkout) staging flags only.
5. With two independent authenticated test members, exercise valid/invalid same-origin checkout, wrong plan/extra input, price mismatch, duplicate/out-of-order webhooks, missed webhook replay/reconciliation, payment failure, cancelled renewal, expired period, customer mapping mismatch, portal access, deletion with open checkout/subscription, user cross-access, nonmember 401, and owner operator access unchanged.
6. Inspect Stripe test mode for zero orphan subscriptions after deletion. Record results without payment-card data or secrets.
7. Keep founding enablement OFF until a durable invite/quantity cap and eligibility controls exist.

## Production release gates (distinct from schema readiness)

1. ANEVUM's connected Stripe merchant account has been verified with charge and payout capabilities enabled. A separate test-mode Stripe account/sandbox and successful test Checkout/portal/webhook reconciliation are still required; an active merchant account by itself is not launch approval.
2. Payment terms, refund/cancellation policy, privacy/retention, sales tax and consumer disclosures must be reviewed against real flows; do not claim existing October 8 privacy/terms approval covers payment data.
3. Obtain brokerage and securities regulatory review before proposing automated investing subscriptions or live execution. Alpaca third-party commercial OAuth/live trading approval is separate.
4. Verify real workload economics, billing rate limits, failure mode/incident procedures, operational support, subscriber cancellation and reconciliation before collecting funds.
5. Perform an affirmative, manual **schema-only** production D1 migration using `.github/workflows/member-billing-production-d1-migrate.yml`. This requires owner approval, ten existing member tables and production checkout flags OFF. No billing activation follows automatically.
6. Only after live Stripe setup, production legal/compliance, two-user billing security acceptance and owner release authorization, set appropriate live Stripe secrets and `ANEVUM_STRIPE_MODE=live` with separately approved production flags. Never reuse staging Stripe keys.
7. Do not enable member broker connectivity, paper execution, live trading, transfers, premium returns, or automatic strategy promotion because billing is online. Those require independent feature releases.

## RHEN multi-account execution: separate workload

The existing Railway `rhen` supervisor is a single tenant, with one volume and one primary live broker credential pair. No website billing change may fan out orders through that process. Next implementation must design and test stateless tenant execution workers and durable per-account state, broker token isolation, independent budgets, idempotency, order reconciliation, queue fairness, audit trails, secure credential storage, per-member lifecycle, and failure isolation. Validate all behavior on paper accounts before proposing a live-member pilot.

**Rollback:** turn off checkout first; preserve billing portal and webhook reconciliation for existing subscriptions; never assume switching off billing flags cancels Stripe subscriptions. Failures involving existing subscribers require explicit provider-side cancellation and notices rather than orphan charging.

## Billing recovery

Authenticated members can refresh Stripe subscription state via a once-per-minute provider reconciliation endpoint. It checks the server-owned customer ID and membership metadata, detects incomplete inventories and revokes obsolete local subscriptions. The per-member sync table supports bounded retries; webhook and refresh updates use a monotonic source observation timestamp. Paid status remains separate from any paper/live broker authority.


## Verified ANEVUM live-mode Stripe catalog (prelaunch, October 9, 2026)

These Stripe IDs are not credentials. The entries are **inactive** and no checkout endpoint is enabled in the production Worker.

- Product: `prod_VPRTx3TlVzIaRj` — RHEN Cloud, `active=false`
- Founding price: `price_1UOcaHDru8RvRNYomaMADO0F` — USD **$2.99/month**, `active=false`
- Standard introductory price: `price_1UOcaNDru8RvRNYoUEK7pHsR` — USD **$4.99/month**, `active=false`
- Production ANEVUM billing portal: not yet configured. The **sandbox customer portal** is configured separately; production portal setup is intentionally deferred until payment readiness.
- The separate **ANEVUM sandbox** is now connected in test mode. Do not substitute live credentials, live catalog IDs, or live transactions for sandbox settings.
- No live Stripe keys or webhook signing secrets have been committed or copied into this repository.

Creating an inactive catalog product and inactive prices does not enable payments. Before any real member charge, review service descriptions, launch terms/refund/cancel disclosures, tax settings, broker/signal service authority, and true marginal economics.

## Verified Stripe sandbox catalog and smoke tests (October 9, 2026)

The authenticated Stripe connector returns **ANEVUM sandbox** as `livemode=false`, distinct from ANEVUM's live merchant account. This section contains **test-only** Stripe IDs, not credentials:

| Stripe sandbox resource | Verified identifier / state |
| --- | --- |
| Product | `prod_VPRpidZ3pDqmwR`, active only inside sandbox |
| Founding price | `price_1UOcwSDSvwYS3kwTHxrYRQev`, USD $2.99 per month |
| Standard introductory price | `price_1UOcwYDSvwYS3kwTqnadIMBD`, USD $4.99 per month |
| Portal configuration | `bpc_1UOcwgDSvwYS3kwT4YdklqqW`, sandbox; default; invoices, payment methods, cancellation at period end |
| Webhook endpoint | `we_1UOczCDSvwYS3kwTcQhU22Iu`, sandbox; targets `/api/billing/stripe/webhook` on the **member staging** Worker |
| Sandbox synthetic customers | `cus_VPRrwvxUp7AGyH` and `cus_VPRtuZKesVKAmp`, not real ANEVUM member identities |

Provider-only smoke tests returned valid hosted Checkout Sessions for two independent synthetic customers at USD $2.99 and $4.99, and returned a valid customer portal session. The sandbox subscription inventory contained **zero subscriptions** immediately after these API checks. Checkout sessions were **not completed** and will expire without collecting payment. This confirms provider resource wiring only; it does **not** prove the ANEVUM staging Worker, its cookie boundary, or real payment webhook reconciliation.

The webhook destination has been created and is **enabled at Stripe**, but ANEVUM staging currently deliberately denies billing webhooks because its feature flag is off and its sandbox signing secret has not been configured. Do not deliver subscription events expecting HTTP 2xx until staging Worker secrets and the D1 migration are installed and the sandbox billing webhook gate is independently enabled.

### Next staging configuration (do not copy secrets to GitHub)

The Stripe Dashboard's selected sandbox provides its **test secret API key** and the **specific webhook endpoint signing secret**. Move those secret strings directly to Cloudflare member-staging Worker Secrets (never place them in source, chat, GitHub issues, or URLs):

- `STRIPE_SECRET_KEY` = the sandbox API secret key (test/sandbox only)
- `STRIPE_WEBHOOK_SECRET` = the signing secret for sandbox webhook `we_1UOczCDSvwYS3kwTcQhU22Iu`
- `STRIPE_FOUNDING_PRICE_ID` = `price_1UOcwSDSvwYS3kwTHxrYRQev`
- `STRIPE_STANDARD_PRICE_ID` = `price_1UOcwYDSvwYS3kwTqnadIMBD`

Keep production's `ANEVUM_STRIPE_MODE=disabled` and all checkout flags disabled. In staging, run the preview D1 migration and independently verify its tables and foreign keys **before** any flag activation. Only then, under a separate staging-only operator authorization, set `ANEVUM_RHEN_BILLING_ENABLED=true`, `ANEVUM_RHEN_BILLING_WEBHOOKS_ENABLED=true` and `ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED=true`; keep `ANEVUM_RHEN_FOUNDING_ENABLED=false` until quota/eligibility rules are implemented.

Do not activate the member's personal brokerage or trading permissions. A subscription only records billing entitlement, not broker authorization.

## Free beta interest waitlist

The beta interest domain is deliberately separate from payment entitlements. Signed-in, verified-email members will be able to join/withdraw when `ANEVUM_RHEN_BETA_WAITLIST_ENABLED=true` in a separately approved release. The member UI says explicitly that registration is voluntary, free and not a trading account or invitation guarantee.

- `member_rhen_beta_waitlist` includes only `user_id` and `joined_at`; the latter is exported in the member's account data and cascades on account deletion.
- The `POST` route ignores any purported client user ID and rejects unexpected JSON fields. Member identity is always resolved from the Better Auth session, and all non-GET mutations pass the existing exact same-origin guard.
- The production and staging deployment sources currently set the flag to `false`; the staging deployment verifier and production binding verifier reject enabling the flag without deliberate release approval.
- No email invitation automation, brokerage link, paper executor, runtime host or payment collection is introduced with the waitlist.

## Sandbox-only checkout testing enabled (October 9, 2026)

After verified provider delivery of `customer.subscription.created` and `customer.subscription.updated` test events (Stripe delivery_success=true), staging checkout is enabled for authenticated, verified staging members only; **production checkout, founding admission, beta waitlist, and all brokerage execution stay OFF**. The synthetic incomplete provider subscription used for delivery was closed without completing payment.

- Exact staging origin: `https://anevum-member-staging.devonakins.workers.dev/me/billing`.
- The stage Worker uses `ANEVUM_STRIPE_MODE=test`, an independent preview D1 database and sandbox-only price IDs.
- Only the **$4.99 standard** test checkout is open; the **$2.99 founding** tier remains visible as planned pricing but cannot be selected.
- Session-scope, verified member email, same-origin mutation, provider price verification and D1 Checkout mutex are mandatory before redirecting to Stripe.
- Stripe sandbox card `4242 4242 4242 4242` with any future expiry and any CVC is a testing fixture, not a real credit-card charge.
- The first complete payment, successful return, signed webhook reconciliation, cross-member denial, portal cancellation, account deletion and no-orphan-subscription checks are **not** certified until two authenticated staging accounts finish E2E acceptance.
- Never send real payment-card details or Stripe sandbox secret keys to ChatGPT, GitHub, Slack, or logs.

The existing `RHEN Cloud Staging Deployment` GitHub Actions workflow performs a staging-only deployment, confirms signed webhook forgery rejection, probes anonymous session denial, inspects isolated preview D1 and rejects any unsafe production flags. Do not merge or enable billing on the production Worker for sandbox testing.

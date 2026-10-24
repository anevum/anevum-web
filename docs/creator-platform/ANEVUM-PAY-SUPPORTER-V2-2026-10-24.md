# ANEVUM Pay / Continuance Supporter Rail V2
Session: ANEVUM.WEB.BUILD.2026-10-24.001.SUPPORTER-PAYMENT-RAIL
Date: 2026-10-24
Status: SOURCE-ONLY SANDBOX CANDIDATE — NOT MERGED, MIGRATED, DEPLOYED OR ENABLED

## Existing decisions preserved

- Stripe supporter checkout remains RETIRED at every legacy /api/v1/member/supporter route, as established by V081 PR #530. The historical Stripe customer, refund, chargeback and dispute records are preserved without writes.
- ANEVUM membership, creator participation, XP, ranking and earned recognition stay FREE and separate from paid cosmetics.
- Existing /support/collection read-only previews, impact transparency, owner-reviewed First Signal concepts and cosmetic milestones are not overwritten or advertised as live.
- Monthly $5 and annual $36 offers are proposals. They are hard-coded server-side in cents only for sandbox; no real checkout is enabled.

## Architecture: ANEVUM owns the transaction system; provider handles money

ANEVUM owns:
1. Supporter page and authenticated checkout initiation (same-origin canonical Better Auth session).
2. Pinned plans/amounts and provider catalog matching.
3. An isolated Cloudflare D1 ledger for checkout intent, payment confirmation, subscription projection, holds, and event de-duplication.
4. Merchant-independent membership status, cancellation request, and future reward entitlement interfaces.
5. Verified provider webhook and receipts/reconciliation plan.

Square SANDBOX owns:
1. Collection and vaulting of card data on a Square-hosted URL.
2. Simulated card authorization and subscription billing.
3. Sandbox payment/subscription/refund/dispute APIs; external evidence for ledger updates.

Square LIVE (future, separately authorized) would hold actual merchant funds and settle the net proceeds into the verified bank account configured by the account owner. This repository NEVER stores bank account/routing numbers, raw card data, or processing credentials in the public bundle.

"Code our own processor" can responsibly mean owning these checkout, billing, ledger, consent, receipts and dispute operations with swappable adapters. Acting as a true card acquirer or ACH originator independently requires financial-network sponsorship, compliant risk controls and banking agreements; source code alone cannot move deposits between accounts without those networks.

## Precise routes, isolated from retired V081

- GET /api/v1/member/support-v2 — authenticated private status; neutral paused response if V2 is disabled.
- POST /api/v1/member/support-v2/checkout — authenticated exact {interval:"month"|"year"}, concurrent checkout lease, provider-side subscription catalog validation, hosted Square Sandbox URL.
- POST /api/v1/member/support-v2/cancel — authenticated owner-only subscription cancellation via verified Square subscription id; never from browser-supplied IDs.
- POST /api/v1/member/support-v2/webhook — raw-body HMAC-SHA256 verification against the exact fixed notification URL; no browser Origin exemption for ANY other route.

Square receipts are not asserted from a redirect. A payment must be retrieved via the Square Sandbox API, match its D1 intent/order, amount/currency/location and payment note, then match a unique live Square Sandbox subscription with the correct plan variation, customer, paid-through date and creation time. Duplicate webhooks do not double-grant. Out-of-order payments may remain pending until a later matching subscription event. Subscription renewals depend on verified Square subscription events, not frontend claims. Refunds and disputes put the subscription's verified cosmetic eligibility on hold.

This candidate does NOT grant paid seals, wall auras, or supporter badges in the sandbox. The existing reward subsystem remains read-only until a later integration verifies end-to-end entitlements across real member accounts, cancellation and refunds. It also does not send receipts, IREN notifications or e-mail confirmations yet.

## Required sandbox-only configuration — not committed

ANEVUM_SUPPORT_V2_ENABLED=true
ANEVUM_SUPPORT_V2_MODE=sandbox
ANEVUM_SQUARE_SANDBOX_ACCESS_TOKEN=<private encrypted staging secret>
ANEVUM_SQUARE_SANDBOX_WEBHOOK_KEY=<private encrypted staging secret>
ANEVUM_SQUARE_SANDBOX_LOCATION_ID=<sandbox location>
ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID=<sandbox subscription variation>
ANEVUM_SQUARE_SANDBOX_YEAR_VARIATION_ID=<sandbox subscription variation>
ANEVUM_SQUARE_SANDBOX_WEBHOOK_URL=https://a.anevum.com/api/v1/member/support-v2/webhook

If staging explicitly uses the approved apex origin, the webhook URL must match that exact canonical origin instead. Deploy to a separate isolated canonical staging Worker after source CI and reviewed D1 schema apply, never to existing V131 without reconciliation.

Configure the Square Sandbox Catalog with EXACTLY one perpetual STATIC paid phase at $5.00 MONTHLY and $36.00 ANNUAL; choose the correct variation IDs, not the parent plan ID. No tax additions, shipping, tips, fees or price overrides should alter those amounts. Configure sandbox webhooks for:
- payment.created / payment.updated
- subscription.created / subscription.updated
- refund.created / refund.updated
- dispute.created / dispute.state.updated

Note: private payment webhook secrets must be supplied as Cloudflare encrypted bindings only, never committed to the repository, issue tracker or chat. No live Square account activation, bank-link action or access-token generation is authorized by this candidate.

## Release and safety gates

1. Pass read-only unit tests for pricing, URL and webhook signature validation, retired Stripe paths and in-memory migration constraints.
2. On an isolated canonical staging account, backup and verify the correct D1 identity marker and apply migration 0011. Do not reuse an older V5, RHEN, or Creator identity store.
3. Verify the configured Square Sandbox variation IDs against the live Sandbox Catalog and the exact webhook URL/secret; never route payment traffic into Square production by configuration accident.
4. Test two different authenticated members, separate Square sandbox customers, correct receipts/status, the return-without-payment case, duplicate and delayed events, underpayment, refunds, chargebacks, cancellation and account closure barriers.
5. Independently test the legacy V081 Stripe fail-close path, profile privacy, account deletion, free sign-up, earned awards and cosmetics. No cross-member attribution.
6. Test accessibility and responsiveness at 1440, 390 and 320 widths, with provider-disabled fallback.
7. Add explicit subscription reconciliation when provider webhooks are missed, privacy-safe payment export, owner audit view, support/receipts/terms/refunds, and opt-in IREN messages before production.
8. Add a separately reviewed Square LIVE adapter only after a real merchant account, verified business bank payout, legal/tax/privacy/recurring terms, chargeback process and explicit owner production release approval. This sandbox adapter has NO production Square hostname.

## Future independence

Retain a provider-neutral ANEVUM account/plan/intents/events/subscription model; add Square live adapter first after QA. Once revenue warrants it, explore a bank ODFI/ACH origination partnership or licensed payment facilitator/BaaS partner for bank transfers. This is not fee-free self-processing: card networks, underwriting, ACH settlement, returns, fraud and compliance still need real external infrastructure. Any bank connector must be scoped to the business payout account, never founder personal bank data in source.

## Known limits of this slice

This is NOT a live supporter checkout or a working bank-deposit processor. It cannot be declared production functional without a configured Square account, real webhook tests, a staging D1 migration and the release gates above. It intentionally preserves read-only reward previews and avoids inventing supporters, deposits, merchant account verification or financial metrics. V081 is draft and the NEXT UI integration work is concurrently on other branches, so this candidate must be reconciled into the approved release lineage instead of merged into V5 main as-is.

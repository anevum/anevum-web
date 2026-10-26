# ANEVUM Commerce & Creator Vault V001 — staging handoff
Session: ANEVUM.OPS.BUILD.2026-10-26.001.COMMERCE-AND-CREATOR-VAULT
Date: 2026-10-26

Status: **SOURCE FOUNDATION ONLY / NOT DEPLOYED / NO CUSTOMER CHARGES**.

## Verified baseline
- Existing web app uses Better Auth member identities and Cloudflare D1.
- Cloudflare account lists existing R2 staging buckets, including `anevum-creator-large-assets-review`; none is to be made public.
- `anevum/anevum-web` main remains its own release stream. This work is on a separate draft branch and is not Creator V1 acceptance.
- Railway is not required for the basic commerce ledger/file-vault control plane.

## Components landed here
- Separate proposed D1 schema for orders, provider event inbox, payment ledger, timed vault passes, member projects, upload reservations, vault files and quota accounting, stored at `docs/commerce-vault/schema-v001.review-only.sql`. It is deliberately outside the protected `migrations/` tree to avoid automatic migration changes and is NOT applied to any database.
- Approved pricing catalog contracts are implemented in `src/server/commerce-contract.mjs` with isolated regression tests `tests/commerce-vault-contract.test.mjs`; `.github/workflows/commerce-vault-contracts.yml` is read-only test CI. **Tests and CI status require separate run verification; do not call tests green based on source alone.**
- Fail-closed Square sandbox configuration; no card details retained, no unapproved product price fallback.
- Owner-approved catalog IDs and exact prices: one-time support $5/$10/$25 and 30-day vault capacity +10 GiB/$4 or +50 GiB/$9. The 100 GiB tier is DEFERRED. Prices are coded but purchases remain disabled.
- Server-only Square webhook HMAC verifier, exact completed payment matching, safe filename/media-size contracts and isolated tests.

## Remaining code needed before PRIVATE staging deployment
1. Integrate authenticated routes with `memberEndpoint`, derive tenant solely from Better Auth session, and enforce Origin on writes.
2. Implement single-use creation/idempotency for payment links with Square Orders/Checkout API. Validate exact approved catalog price server-side. Square sandbox only.
3. Verify signatures over *unmodified* raw request body using the exact registered webhook URL and reconcile payment details with Square API; store events idempotently and grant passes within D1 transaction semantics.
4. Wire private R2 binding and bounded uploads/downloads; check project ownership, atomic quota reservation, upload object metadata/hash, interrupted upload cleanup and delete behavior.
5. Implement paid entitlement expiration, refunds/revocations, cancellation, support receipts, concurrency and multi-session abuse controls; provide transaction history with privacy-safe retention.
6. Account export/delete **must** cover Vault objects, ledger/legal retention and backups. Test A/B isolation, restore and rollback with disposable DB and isolated R2 before production acceptance.
7. Build premium UX within current cinematic layout, not a second storefront; clearly distinguish one-off support from time-limited storage passes.
8. Add real sandbox end-to-end Square tests, mobile usability, independent security review, reviewed customer policies, and separate release authorization. Catalog pricing has owner approval; this does not waive any release gate.

## Hard gates
- DO NOT apply migration to live D1 before isolated restore and acceptance.
- DO NOT link actual Square production credentials, solicit payments, or enable checkout.
- DO NOT configure open/public R2 access or promise unlimited storage.
- DO NOT enable a `VAULT_ENABLED` or `ANEVUM_COMMERCE_ENABLED` production flag.
- Keep public production, Creator V1 #325 and dates #308 unchanged.
- Historical Stripe data remains separate and cannot grant new entitlements.

## Approved pricing and sustainability direction (October 26, 2026)

Founder approved the price schedule and sustainability-first business direction on October 26, 2026. This is **pricing approval only**, not permission to deploy, connect live Square accounts, enable charges, publish a storefront or incur spend. The goal is operating sustainability and modest discretionary family income, not maximizing profit. Household cost data is not verified.

Owner-approved launch prices: Free private vault 2 GiB; voluntary one-time support $5, $10, or $25; 10 GiB extra capacity for 30 days $4; 50 GiB extra capacity for 30 days $9. An optional 100 GiB tier at $15 is **deferred and is not in the active catalog**. The $3 and $8 earlier examples are superseded. Do not sell until backups, account isolation, anti-abuse, deletion/export, expiration/grace policy and genuine payment verification are proven. No pay-to-win progression.

Input sources checked October 26: https://developers.cloudflare.com/r2/pricing/ ($0.015/GB-month, first 10 GB-month free, request tiers); https://squareup.com/us/en/payments/our-fees (Square Free online/payment links 3.3% + $0.30); https://developers.cloudflare.com/d1/platform/pricing/ . Check actual account pricing before launch.

Hypothetical monthly mixes, not predictions: Early: 20 supporters at $5, ten 10-GiB passes and two 50-GiB passes, gross $158, estimated Square fees $15, storage $3, assumed other platform budget $35, approximately $105 before tax/support. Growing: 100 supporters at $5, forty small passes, ten medium passes, gross $750, fees $70, storage $13, other budget $65, approximately $602 before tax/support. Established: 350 supporters averaging $6, 120 small passes, 45 medium passes, ten large passes, gross $3,135, fees $261, storage $67, other budget $150, approximately $2,657 before tax/support. These estimates assume all paid capacity filled and exclude free-user storage, backup copies, taxes, refunds, fraud, support labor and creator payouts. GiB allocation differs from R2 decimal GB accounting.

Reconcile cash before owner draws; maintain infrastructure, tax, refunds and recovery reserves. Track free-user storage consumption, conversion and supporter retention. Capacity expiry must provide notice and export/read-only grace, not surprise irreversible deletion. Payments and production flags remain disabled pending explicit launch approval.

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
- Separate additive D1 schema for orders, provider event inbox, payment ledger, timed vault passes, member projects, upload reservations, vault files and quota accounting.
- Fail-closed Square sandbox configuration; no card details retained, no unapproved product price fallback.
- Fixed catalog identifiers (supporter, optional 10 GiB or 50 GiB thirty-day pass). No price selected; prices require explicit owner approval.
- Server-only Square webhook HMAC verifier, exact completed payment matching, safe filename/media-size contracts and isolated tests.

## Remaining code needed before PRIVATE staging deployment
1. Integrate authenticated routes with `memberEndpoint`, derive tenant solely from Better Auth session, and enforce Origin on writes.
2. Implement single-use creation/idempotency for payment links with Square Orders/Checkout API. Validate exact approved catalog price server-side. Square sandbox only.
3. Verify signatures over *unmodified* raw request body using the exact registered webhook URL and reconcile payment details with Square API; store events idempotently and grant passes within D1 transaction semantics.
4. Wire private R2 binding and bounded uploads/downloads; check project ownership, atomic quota reservation, upload object metadata/hash, interrupted upload cleanup and delete behavior.
5. Implement paid entitlement expiration, refunds/revocations, cancellation, support receipts, concurrency and multi-session abuse controls; provide transaction history with privacy-safe retention.
6. Account export/delete **must** cover Vault objects, ledger/legal retention and backups. Test A/B isolation, restore and rollback with disposable DB and isolated R2 before production acceptance.
7. Build premium UX within current cinematic layout, not a second storefront; clearly distinguish one-off support from time-limited storage passes.
8. Add real sandbox end-to-end Square tests, mobile usability, independent security review, owner approved prices/policy, and separate release authorization.

## Hard gates
- DO NOT apply migration to live D1 before isolated restore and acceptance.
- DO NOT link actual Square production credentials, solicit payments, or enable checkout.
- DO NOT configure open/public R2 access or promise unlimited storage.
- DO NOT enable a `VAULT_ENABLED` or `ANEVUM_COMMERCE_ENABLED` production flag.
- Keep public production, Creator V1 #325 and dates #308 unchanged.
- Historical Stripe data remains separate and cannot grant new entitlements.

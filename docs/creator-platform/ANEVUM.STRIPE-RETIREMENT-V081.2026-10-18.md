# ANEVUM.WEB.PATCH.2026-10-18.001.STRIPE-RETIREMENT

Scope: Retire Stripe from ANEVUM's future checkout flow; do not close the separate Stripe merchant account or erase financial history.

## Reason

A previously documented live merchant dispute remains unresolved and must be handled separately from software changes. No live Stripe subscriptions or active payment links were observed at inspection. Do not include account balances or dispute details in this public repository.

## Source changes

1. Canonical member API rejects every /api/v1/member/supporter route, including checkout, billing portal, payment webhooks and paid-cosmetic modification, before authentication, Stripe code, or any database writes. All methods fail closed with 404.
2. Canonical staging scheduled worker stops calling payment-related subscription/checkout reconciliation. Studio R2 cleanup remains independent under its existing guard.
3. /support becomes an informational page. It preserves the existing Continuance presentation, clearly marks proposed membership prices and payment pause, and has no checkout button, Stripe redirect, billing portal, or payment fetch.
4. /support/collection displays non-purchasable cosmetic previews without querying retired membership APIs. No earned XP, medals, achievement levels, or granted member records are removed.
5. Public transparency uses processor-neutral wording.
6. The existing Stripe library, migration, audit ledger, account-closure restrictions, and historical webhook schemas remain in source for reconciliation, privacy export, investigation, and dispute retention. These are not authorized to run on active routes.

## Important limits

- This patch does NOT close the Stripe account, remove bank connections, erase billing records, reverse the chargeback, eliminate the debt, or transmit dispute evidence.
- Do not delete Stripe invoices, disputes, transaction ledgers, identity bindings, or source required for defensible financial reporting until the account is resolved.
- Any Stripe credentials in deployed Cloudflare environments should be removed only after inventorying bindings and confirming no other retained route uses them. Disconnecting ChatGPT access alone does not revoke API keys.
- Do not activate a replacement Square or other payment link until provider onboarding, tax/refund policy, verified server-side entitlements, and end-to-end tests are complete.
- Do not deploy over simultaneous V080 work without reconciling changes and passing the full site and canonical-member CI.

## Acceptance

- Run: node --test test/stripe-retirement-v081.test.mjs test/supporter-compact-v045.test.mjs test/supporter-integration-v032.test.mjs test/supporter-rewards-v034.test.mjs
- Run npm test and npm run build plus exact-head CI.
- Verify on the staging and production URLs after a reviewed deployment: all member supporter payment routes inaccessible, /support without payment navigation, and member sign-in, posts, uploads, player cards, earned recognition, and 3D collectibles preserved.

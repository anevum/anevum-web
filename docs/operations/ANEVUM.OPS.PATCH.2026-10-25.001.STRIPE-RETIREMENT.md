# ANEVUM payment-provider retirement — 2026-10-25

Session: `ANEVUM.OPS.PATCH.2026-10-25.001.STRIPE-RETIREMENT`
Status: DRAFT SOURCE ONLY; no production deployment or customer financial operation authorized.

## Decision
Owner permanently retired Stripe as an ANEVUM payment provider. No new checkout, subscription, billing portal, webhook, provider network call or account configuration is allowed. Square is a possible replacement direction but NO Square checkout is deployed or authorized by this change.

## Source changes
- The canonical supporter Worker no longer recognizes payment POST endpoints and no longer accepts payment webhooks (404).
- The scheduled Worker no longer performs subscription or checkout reconciliation.
- The provider-specific remote-request implementation and active billing handlers are removed; surviving supporter endpoints return disabled, nonpayable states.
- The public support screen has no pricing switch, payment action or external processor redirect.
- Recognition concepts and privacy-safe aggregate research remain read-only; the legacy supporter finance report is a reviewed, provider-neutral report, NOT a live billing system.
- No DB table, customer history, identity data, refund evidence or tax record is deleted; account closure continues to block deletion where a historical obligation must be reviewed.

## Historical retention / external cleanup
Immutable migrations and past PRs document previously designed billing fields; do not edit or rerun historical migrations or rewrite transaction history. Provider account closure, cancellation of any actual subscriptions or mandates, evidence preservation, transfer of balances and resolution of prior financial disputes require independent external-account verification. Do not assume disabling ANEVUM code cancels anything at the old provider.

## Pre-release gates
1. Exact-head Node tests, TypeScript/Vite builds and existing source allowlist QA.
2. Static audit of every deployment config and branch for remaining active payment references.
3. Signed-in staff and anonymous browser smoke showing no checkout/portal/webhook access.
4. Cloudflare/Railway protected secrets audit and separately authorized removal if any active bindings remain.
5. No merge/deploy before approved branch integration into the active UI-convergence line.

Primary project board: https://github.com/anevum/anevum-web/issues/325
Active concept-convergence review: https://github.com/anevum/anevum-web/pull/735

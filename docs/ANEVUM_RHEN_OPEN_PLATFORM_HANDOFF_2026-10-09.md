# ANEVUM.RHEN.PACKAGE.2026-10-09.002.OPEN-PLATFORM-OVERHAUL
## Canonical handoff and implementation manifest

**Prepared:** 2026-10-09. **State:** Planning complete, draft review in progress. **Not a release.**
**Parent epic:** https://github.com/anevum/anevum-web/issues/243
**Documentation PR:** https://github.com/anevum/anevum-web/pull/242
**Branch:** plan/rhen-open-platform-20261009
**Product owner:** RHEN. **Integrating repository:** anevum/anevum-web.

### 1. Package contents

1. ANEVUM_RHEN_OPEN_PLATFORM_PRODUCT_SPEC_2026-10-09.md — values, offerings, free-first member experience, curriculum, community, supporter integrity.
2. ANEVUM_RHEN_OPEN_PLATFORM_ARCHITECTURE_2026-10-09.md — rights/capabilities, proposed additive D1 records, APIs, quotas/leases, failure model, security.
3. ANEVUM_RHEN_OPEN_PLATFORM_ROLLOUT_2026-10-09.md — release slices R0–R9, accepted and deferred decisions, QA, cost gates, cutover and rollback.
4. THIS HANDOFF — canonical issue routing and immediate next steps for future sessions.

### 2. New implementation work, not yet implemented

- R2 free learning: https://github.com/anevum/anevum-web/issues/244
- R3 member lesson progress: https://github.com/anevum/anevum-web/issues/245
- R4 private, R6 moderated research: https://github.com/anevum/anevum-web/issues/246
- R7 voluntary supporter cosmetics with new approved Stripe catalog: https://github.com/anevum/anevum-web/issues/247
- R5 member usage, R8 extra compute UI (not priced yet): https://github.com/anevum/anevum-web/issues/248
- RHEN per-member admission/lease/cost telemetry: https://github.com/anevum/rhen/issues/464

### 3. Existing operational work to preserve

- Current member/OAuth infrastructure and live-state reconciliation: https://github.com/anevum/anevum-web/issues/210
- Owner/private terminal identity hardening: https://github.com/anevum/anevum-web/issues/235 and https://github.com/anevum/anevum-web/pull/236
- Future per-member paper Alpaca connect: https://github.com/anevum/anevum-web/issues/237
- Existing Stripe billing foundation and 2-authenticated-user sandbox acceptance: https://github.com/anevum/anevum-web/pull/240 and https://github.com/anevum/anevum-web/issues/241
- Isolated RHEN paper kernel and pilot architecture: https://github.com/anevum/rhen/issues/462 and https://github.com/anevum/rhen/pull/463

### 4. Unresolved baseline before touching runtime

- Reconcile current main Worker member-enabled variable with issue #210 historical public-registration-disabled narrative by checking actual deployed availability and safeguards.
- Complete immutable owner-member binding and crossed-cookie stream/API denial in a real two-user staging test before expanding any member capabilities.
- Existing 4.99 Stripe sandbox checkout is in staging, with signed webhook delivery tested. User-mapped, two-authenticated-session Checkout, cancel, refund and deletion are NOT certified. Provider API key previously exposed in a screenshot needs confirmed rotation.
- Live RHEN owner service remains a single Railway replica with private broker credentials and volume. New paper kernel PR #463 is not equivalent to a deployed hosted member bot.
- No new production database migration, supporter catalog or compute SKU has been approved.
- Market data redistribution, Alpaca commercial Connect and future live order permission, adviser status/other relevant laws, taxes and consumer terms must be reviewed before paid trading-related activation.

### 5. Scope guardrails

- Do not merge planning as authorization to execute R2–R9 automatically.
- Do not touch RHEN champion strategy, signals, risk levels, current Railway broker-write paths, existing production payment switches or owner terminal.
- Do not alter or reuse existing inactive 2.99/4.99 live-mode prices as the new supporter or compute plans; preserve provider records and safe migration path.
- Do not market paper simulations as live results or invite member live trading.
- Keep free educational material truly free; free paper capacity bounded and honest.
- Supporter can show cosmetic profile/terminal identity but gets no privileged research credibility or trading edge.
- Billing must not confer brokerage authority; community membership must not confer permission to use a member's private broker data.
- No public UGC until human moderation and publication consent are in place.
- Prioritize shipping finished lessons and verified member controls over expanding placeholder pages or speculative features.

### 6. Next executable task

**Recommended next implementation session:** R1 dependency closure + R2 two complete lessons. Specifically:
1. Verify current real production/staging member availability, using current deployed runtime rather than stale issue summaries.
2. Close and document existing owner/member two-account safety gates and validate sandbox payment without production charging.
3. Create a NEW narrowly scoped R2 branch from a verified main head; build two complete, sourced, keyboard/mobile-usable free learning lessons and truthful RHEN navigation. This is the first independent user-facing value with no live broker or Stripe dependency.
4. Merge/deploy R2 only after CI, owner review and live page verification. Do not start R3–R8 in parallel merely because specs exist.

### 7. Acceptance for this package

- Documentation PR is draft and changed files are docs only.
- Parent issue references existing work and granular tasks without duplicating in-flight implementation.
- Owner can inspect exactly what is locked, deferred, and still requires explicit authorization.
- Safe handoff can be picked up in a new session using this canonical ID.

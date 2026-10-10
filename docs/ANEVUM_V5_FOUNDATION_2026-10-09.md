# ANEVUM V5 — FOUNDATION | Commons V5.1 alignment

**Locked cross-product update:** ANEVUM.V5.FOUNDATION.2026-10-09.001 (owner decision 2026-10-09).
**Status:** staged integration contract, no website production release or live RHEN changes.

## Parallel work, not a website restart

- [Commons Stage 1 V5.1 shell PR #256](https://github.com/anevum/anevum-web/pull/256) continues to own the social application layout, visual polish, color experiments and mobile navigation. Do not replace its current design direction.
- The V5 Foundation child branch builds on V5.1 but limits changes to independent, testable identity and evidence contracts. It must not alter the site shell, theme or real Field Notes feed.
- Parent systems design [RHEN PR #469](https://github.com/anevum/rhen/pull/469) and architecture [#468](https://github.com/anevum/rhen/issues/468); isolated successor journal [#470](https://github.com/anevum/rhen/issues/470).
- Website tracker [#257](https://github.com/anevum/anevum-web/issues/257).

## Contract and development rules

- Versioned schema: contracts/foundation/workspace-state.v1.schema.json, identical to the RHEN successor copy.
- Client parser: src/contracts/anevum-foundation.ts. It accepts only allowlisted, server-scoped private workspace state; it rejects mixed versions, unexpected brokerage fields, cross-member identity mismatches, unapproved member-live authority and legacy owner-connection reuse.
- This parser is **not authentication**. The Cloudflare Worker must derive member, workspace and broker scopes from a verified session and enforce them on every API/event/storage access before any real terminal data becomes available.
- Legacy founder account continues to route exclusively to /command/rhen/operate. Future member RHEN app routes through /apps/rhen; until proven paper-only backend integration, no claims of active personal bot execution or broker order authority.
- Evidence status NOT_CONFIGURED / AWAITING_EVIDENCE / BLOCKED / REPRODUCIBLE is a provenance indicator, **never** a profitable strategy or promotion claim.
- Community data and trading data have different tenancy, permission, storage and privacy contracts. Commons never consumes founder fills, API credentials or private broker positions.
- Do not activate old stacked Commons/Broker PRs #249/#251/#252 wholesale as part of a visual or F0 contract merge. Review APIs/migrations/roles individually after design and privacy acceptance.

## QA / staging sequencing

1. V5.1 visual shell retains independent owner mobile and desktop QA.
2. F0/1 contract tests in this child branch run on Node 22 and TypeScript; no production routes or D1 migrations change.
3. F2 adds gated private paper workspace UI only after the successor evidence collector and per-account access-control API are tested with two different members.
4. F3 introduces authentic research passports, empty/blocked/stale states, and consented publishable summaries after the Evidence Vault can prove source/holdout integrity.
5. F4 paper pilot first, member live only following authorization, provider/compliance approval and independent release review.

**Hard hold:** no production Worker deploy, no D1 mutation, no user broker funding/order routes and no founder terminal privilege changes are authorized by this cross-product design lock.

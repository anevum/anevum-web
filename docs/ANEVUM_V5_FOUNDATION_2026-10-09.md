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

## Owner account is a normal RHEN brokerage workspace (new decision)

The previous founder-only Command/broker coupling is **legacy data**, not V5 product architecture. In RHEN V5 the ANEVUM owner signs into Commons like everyone else, receives an independent `RHEN_NEXT` workspace under their verified member identity, and initiates **the same** regulated broker OAuth link, authorization, revocation, paper-trading and terminal onboarding as any other member. ANEVUM founder/admin role is a **separate authorization capability** for company management; it grants no automatic trading access to other people's workspaces. The owner can use their own RHEN terminal and manage ANEVUM's infrastructure from a distinct admin area.

Only the quarantined `LEGACY_FOUNDER` workspace uses the old owner-only route `/command/rhen/operate`, and then only until the original production service and records are safely retired. A new founder `RHEN_NEXT` workspace must route to the ordinary private `/apps/rhen` just like a member workspace; its broker-link state initially is `NOT_LINKED` with `NONE` live authority. Owner and other members must pass the same broker licensing/provider approval, KYC/authorization, session-bound tenant protection, and independent paper/live safety gates. No Railway Alpaca keys may be copied to the website member database. Old trading results remain historical read-only evidence rather than being credited to the new account's performance.

Production retirement and evidence-preserving cleanup: [RHEN #474](https://github.com/anevum/rhen/issues/474). The owner authorized stopping further live trading but **not** liquidation or deletion of positions, orders or backups. Because the broker's authoritative open positions/orders are not accessible through the currently connected market-data tools, no live shutdown or volume deletion is permitted before verification.

## Simplified product scope (owner decision)

The current GRAEN, VELUM, and NOSTRA identities were **prototypes**, not approved permanent products. The ANEVUM V5 interface should present **one RHEN application** with internal areas:

- **RHEN Trading / Terminal** — member-specific account, paper trading now and broker-approved live trading later; founder legacy terminal owner-only.
- **RHEN Research** — bounded strategy experiments and review (formerly GRAEN), gated by Evidence Vault provenance.
- **RHEN Replay** — deterministic scenario/backtesting (formerly VELUM); only label results as reproducible after verified input, execution parity and independent holdout.
- **RHEN Forecast** — optional research-only prediction/calibration (formerly NOSTRA); hidden or clearly unavailable until implemented.
- **RHEN Operations** — deterministic live safety/health/capture-status/alerts; not a separate IREN product.

**IREN is deferred** to a future operator/AI project when hardware or hosted inference is warranted. Do not surface an independent IREN runtime, claim it is healthy, block RHEN on GPU procurement or remove basic alerts. Public historical prototype pages may remain for archival accuracy, but current navigation, plans and subscription claims must not market GRAEN/VELUM/NOSTRA as standalone working services. Keep all other ANEVUM future applications separate from RHEN; this consolidation concerns only the RHEN trading/research prototype family.

Canonical architectural decision: [RHEN consolidation ADR 002](https://github.com/anevum/rhen/blob/design/anevum-vnext-greenfield-platform-20261009/docs/architecture/2026-10-10-rhen-integrated-prototype-consolidation.md).

## QA / staging sequencing

1. V5.1 visual shell retains independent owner mobile and desktop QA.
2. F0/1 contract tests in this child branch run on Node 22 and TypeScript; no production routes or D1 migrations change.
3. F2 adds gated private RHEN paper workspace UI only after the successor evidence collector and per-account access-control API are tested with two different members. Internal Research/Replay/Forecast views follow completed evidence and functional proof; they are not separate app launches.
4. F3 introduces authentic research passports, empty/blocked/stale states, and consented publishable summaries after the Evidence Vault can prove source/holdout integrity.
5. F4 paper pilot first, member live only following authorization, provider/compliance approval and independent release review.

**Hard hold:** no production Worker deploy, no D1 mutation, no user broker funding/order routes and no founder terminal privilege changes are authorized by this cross-product design lock.

## F0b incremental staging implementation — private RHEN_NEXT workspace allocation

- New isolated D1 migration `0004_member_rhen_workspaces.sql` stores one durable random workspace ID per authenticated Better Auth member, with a unique workspace ID and cascade deletion. This is identity only: no broker ID, keys, funds, trading orders, strategy rights or extra admin access.
- `GET /api/member/rhen/workspace` reads the authenticated member's own state; same-origin `POST` with no payload allocates it idempotently. Query-selected member/workspace IDs and client-provided fields are explicitly denied.
- The server emits only the byte-frozen `anevum.workspace-state.v1` projection with `MEMBER_PRIVATE`, `RHEN_NEXT`, `NOT_CONFIGURED`, `NONE`, `NOT_LINKED`, and `VIEW`. Founder is treated as a normal member for this successor workspace. The TypeScript client validates the response against the shared allowlist.
- The RHEN overview provides a truthful staging-only provisioning action, private workspace ID and inactive engine/broker indicators. It cannot read the old operator terminal or place orders.
- Staging alone sets `ANEVUM_V5_WORKSPACES_ENABLED=true`; production explicitly sets `false`. Preview D1 migration, real two-account OAuth browser acceptance, complete cross-repo drift CI and the updated V5.1 release are still independent acceptance gates.
- This commit is **draft only**. It must NOT trigger a production release, D1 migration, legacy RHEN restoration, provider OAuth activation or real-money operation.


## October 10 migration lineage guard (review-only)

Staging D1 recorded `0003_member_billing.sql` during the separate, unmerged
billing experiment in WEB PR #240. The original F0 workspace migration
`0003_member_rhen_workspaces.sql` collided with that applied ledger name.
The stacked WEB PR #263 therefore:

- restores **only** the exact reviewed SQL migration `0003_member_billing.sql`
  from PR #240 commit `f0fd0bcd458b89eaac86717d306773764dc4314d`,
  pinned to Git blob `54333fa22dfce87a58e16e3e85b2d27a59b33544`;
- renames the workspace allocation schema to `0004_member_rhen_workspaces.sql`
  with idempotent create and no destructive DDL;
- validates the applied preview D1 ledger against local reviewed migration
  filenames and the immutable billing 0003 SQL source *before* any new apply;
- fails closed when applied source is absent, renamed or unexpectedly changed;
- verifies `0004` registration after a separately authorized preview apply.

**Evidence boundary:** The reviewed billing `0003` source is present and
pinned, but a D1 ledger name does not prove that the historically applied
SQL had identical bytes. Before any migration approval, compare the
existing preview table definitions and constraints with the reviewed SQL.

**Rollout boundary:** Draft PR #263 has no migration/deployment approval.
Production D1, Stripe/checkout/webhooks, broker integration, execution, and
other paid services remain outside this change. The preview migration workflow
can run on a future `main` push, so never merge without reviewing that gate.
Two-account workspace tests passed; real draft write/read/export and deletion
tests remain pending. Neither staging acceptance nor green CI authorizes
production deployment or trading.

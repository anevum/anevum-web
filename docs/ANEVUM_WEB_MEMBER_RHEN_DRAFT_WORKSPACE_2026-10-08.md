# ANEVUM.WEB.BUILD.2026-10-08.002.MEMBER-RHEN-DRAFT-WORKSPACE

## Purpose

Build the first genuinely user-owned RHEN configuration record within the member account system, **without** suggesting member brokerage linking, paper simulation, live execution or trading permissions are available.

## Changes

- Member RHEN workspace route: `/apps/rhen/setup`. Signed-in users can manage one saved configuration draft when the rollout gate is enabled.
- Authenticated API: `/api/member/rhen/draft` supports GET, PUT (complete replacement), and DELETE. Every query is scoped by Better Auth `user.id`; clients cannot submit an account ID.
- Strict schema and validation: one record per member; label 1–48 characters; U.S. equities/ETFs and long-only fixed at the server; 1–10 open positions; numeric allocation ceiling limits; one position cannot exceed total ceiling. These fields are design preferences, not executable strategies or actual risk controls.
- D1 migration: `0002_member_rhen_drafts.sql` with owner FK/ON DELETE CASCADE and database-level limits.
- Export: the existing JSON account export includes the saved draft if the draft table exists. Account deletion is protected by the foreign-key cascade.
- Boundaries: `executionEnabled: false` and `brokerageConnected: false` are backend constants. No broker secrets, positions, orders, payment flow, or strategy promotion interfaces are added.
- Tests: config validation including unexpected-field rejection, tenant-scoped parameterized reads/writes/deletes, SQL constraints and cascading deletion, anonymous API denial and staging/production gate isolation.

## Deployment state and gates

**Production:** `ANEVUM_MEMBERS_ENABLED=false` and `ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED=false`. Production D1 stays untouched until separately approved migration. Existing Cloudflare Access protects `/command/rhen/*` and `/api/command/*`. Live Railway RHEN unchanged.

**Staging:** `ANEVUM_MEMBERS_ENABLED=true` with isolated preview D1. `ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED=true`; every request additionally verifies table `member_rhen_drafts` exists. Until preview migration completes the new draft endpoint fails closed with HTTP 503. The automatic main-branch migration workflow targets ONLY preview D1 and validates both nine core member tables and the single new draft table.

**Production D1 migration:** Owner confirmation workflow remains manual, checks the two committed migration files and explicitly validates the new table after applying. No production sign-in flag or RHEN execution authority is set by the migration.

**Prerequisites for member go-live:** finish the original member OAuth security acceptance, encrypted production OAuth secrets, Google production callback, production D1 authorization and distinct production registration flag approval in issue #210. Before enabling production drafts, review the privacy notice against actual preference storage and run two-account create/read/edit/export/delete isolation tests.

## What is not delivered

This is not a broker connector, a trading bot, investment advice, a simulation, a cash balance, or a rewards payout ledger. A saved configuration draft must never be automatically imported into an execution runtime. A later release must add an independent approval and validation pipeline before any member account can trade.

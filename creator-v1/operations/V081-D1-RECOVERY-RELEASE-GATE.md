# ANEVUM D1 Recovery / V080 Staff Activation Release Gate
Session: ANEVUM.OPS.PATCH.2026-10-19.001.D1-QUOTA-RECOVERY
Source PRs: #533 (V080 authentication recovery), #536 (V081 D1 efficiency)
Status: RELEASE HOLD — source implemented, production unchanged

## Observed incident
- Staff V080 returned `{"error":"Staff identity unavailable"}` because a D1 operation failed during identity/role verification.
- Cloudflare reported error 7500: account-wide Free daily **rows-read** quota exceeded.
- 2026-10-19 GraphQL D1 Analytics reported ~9,007,900 rows read and ~331,540 read queries for `anevum-canonical-member-staging`.
- Top query shapes: XP ledger `SUM(amount)` ~2.59M rows; repeated D1 `pragma_table_info(?)` ~1.87M rows, ~260k calls; repeated `sqlite_master` checks ~3M rows.
- A single `SELECT 1` succeeding does NOT prove quota recovery: a subsequent real query again failed with 7500.
- Separately, live email-signup canary returned HEALTH_NOT_READY, PUBLIC_REGISTRATION_NOT_OPEN, EMAIL_CODE_UNAVAILABLE; do not change these checks or assume the sole cause without verification.

## Locked safety decisions
1. Production `anevum.com/staff/projects*` stays routed to rollback Worker `anevum-staff-project-review-v003` until account quota, auth, full CI and browser checks pass.
2. Cloudflare Access and canonical Better Auth + D1 staff_access_grants remain enforced on every request. Never cache user sessions, staff grants, permissions, revocation, or role by email.
3. No existing project, including Single Drift, is deleted or unpublished during tests. Create a disposable test fixture for deletion tests.
4. All database migrations are additive and tested offline; no schema teardown, R2 replacement, or automatic subscription purchase.
5. Owner deletion remains gated and auditable. No direct deletion of published assets until rollback and cleanup recovery have been verified.

## Source changes ready for review
- #533: distinguish auth/D1 quota failures, branded fail-closed errors, R2 deletion retry UI, preserve authorization.
- #536: reuse Better Auth engine only for same D1 binding + exact config. Actual session is fetched from D1 on every request.
- #536: cache verified *table metadata only* for 30 seconds per isolate/binding; verify issuer marker on every canonical request.
- #536: cache successful static schema checks for profiles, progression, spaces and recognition for 30 seconds. These are not permission decisions.
- #536: materialized XP totals table with insert/update/delete triggers. Legacy event-sum fallback is permitted only when the totals table does not exist; other D1 exceptions fail closed.
- #536: isolated SQLite tests cover event backfill, correctness, idempotence, and source-level auth session isolation.

## Required controlled rollout
1. Before any mutation: check latest full CI on both branches; fix code-level regressions. Do NOT waive live signup canary failures.
2. Confirm account D1 quota has recovered with a real low-cost table read, and check GraphQL D1 Analytics daily and per-query read counts. If daily budget remains critically exhausted, hold.
3. Stage V081 gateway Worker with exact existing Cloudflare bindings/config; run anonymous denial, authenticated identity, owner/nonstaff role, signup health, session expiry and revocation tests. No synthetic privileged header shortcuts.
4. In isolated D1, apply migration `creator-v1/canonical-auth/migrations/0011_member_xp_totals.sql` atomically. Verify `SUM(member_xp_events.amount)` agrees with `member_xp_totals.xp` and that triggers update correctly on a disposable member.
5. When quota headroom and staged tests are established, apply additive XP migration to canonical production MEMBER_DB during a controlled interval with writes quiesced; back up state/bookmark and retain rollback path. Do not rerun backfill with arbitrary UPDATE statements.
6. Deploy built V081 canonical gateway only with exact previous origin, Cloudflare Access, secrets, static assets and D1 bindings; test login, signup, rewards, notifications, staff owner grant and quota.
7. Activate separately the pre-uploaded V080 staff candidate by switching only `anevum.com/staff/projects*`. Preserve `/staff` and `/staff/projects/community*`.
8. Browser-smoke-test mobile and desktop signed in as owner: project library, read-only preview, review queue, revoke/restore with a disposable published test project, and owner-only delete. Verify negative roles and R2 failure/retry. Never use Single Drift for a destructive test.
9. Read back Cloudflare route, D1 project status, audit event and deletion receipts. Monitor quota usage by query across the following period and roll back promptly on elevated errors.

## Rollback
- Staff route: replace `anevum.com/staff/projects*` script with `anevum-staff-project-review-v003`.
- Auth gateway: restore the previous reviewed Worker version, preserving existing D1/R2 bindings and staff grants.
- XP totals migration is additive; old code still reads `member_xp_events`, so it can remain in place during rollback.
- Do NOT purge XP event history; it is the source of truth for validation and rollback.

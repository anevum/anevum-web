# ANEVUM — Canonical D1 Read Budget Guard

Session: `ANEVUM.OPS.PATCH.2026-10-19.001.CANONICAL-D1-READ-BUDGET`

## Verified issue

On October 19, Cloudflare D1 returned `7500`: the daily free-tier row-read limit had been exceeded on the canonical staging member database. GitHub's read-only public signup canary at `https://anevum.com/api/v1/member/health` and `/auth-methods` returned a closed/unavailable status. This blocks V081 release until the live canary is healthy; it is not evidence that V081 caused the quota exhaustion (its reputation flag remains disabled).

## Bounded source change

Before this patch, `canonicalSchemaReady()` queried *every* D1 table name on every canonical Worker request. As the shared staging database accumulates schemas, the returned metadata volume grows with unrelated tables. The patch requests only the six expected issuer/auth table names. The issued query has constant-size results, and **retains** the independent issuer/migration marker check and the fail-closed behavior on missing tables or database errors.

The source change alone cannot restore a database once its daily read quota has already been exhausted. It also does not prove this was the sole source of excess reads. Additional authenticated queries and polling frequency may still require review.

## Safety gates

- No database commands, production deployment, account mutations, migrations, secrets, or feature-flag changes in this PR.
- Keep live signup canary hard-failing until the endpoints actually report healthy; do not modify the canary expectation.
- Run isolated SQLite regression tests for more than 130 unrelated schemas, absent required tables, issuer mismatch, and D1 errors.
- Before production release, inspect Worker request volume and D1 row reads after the quota reset, confirm the SQL is applied to the correct apex Worker, and verify the real email code flow.
- Retain the existing rollback checkpoint and do not assume a successful source build means signup is operational.

# R3 private learning progress

Session: ANEVUM.WEB.BUILD.2026-10-11.019.PRIVATE-LEARNING-PROGRESS
Parent: R3 #245; R2 #321; V5 #259; public launch #308 (January 1, 2027).
Base: verified R2 `3a859bc0bb6f4fd0185d2f0953aa2462780b14aa`.

## Implemented, not activated

Optional /me/learning inside the current member shell. Explicit Mark read / Mark
unread actions, current-version count, updated-lesson warning, verified save then
readback, and no fake grading/certificates/rewards or automatic reading telemetry.
Public lessons remain anonymous; their exercises remain entirely on-page.

Member-scoped GET /api/member/learning/progress and PUT .../:slug use verified
Better Auth identity, verified email, same-origin writes, a mandatory stale-tab
comparison header for writes, authored lesson/version allowlist, a 512-byte UTF-8
stream limit, bounded stream chunks/deadline, optimistic revisions and 12 writes
per member per fixed minute. Headers disable browser/CDN caching. The header is
only a rejection check; user.id is the only SQL tenant key. Invalid/ambiguous
responses clear displayed progress and require an explicit reload, not a retry.

Schema 0009 lives in migrations-learning, not any currently deployed migration
path. Main and billing PR #240 already reserve 0001-0008. Both tables cascade on
account deletion; existing account export and defensive cleanup are integrated.
A partially migrated or unavailable store fails export instead of claiming an
empty result. Existing saved markers export even with saving disabled.

## Locked boundaries

ANEVUM_MEMBER_LEARNING_ENABLED is absent/off in all existing configs. The module
additionally requires the explicitly configured HTTPS Workers preview origin.
Production remains blocked even if the flag is accidentally supplied. No D1
migration, provider config, account, entitlement, publication or broker action
was executed. No checkout, subscription or account-funding dependency exists.

## Verification and release sequence

Local tests use synthetic members and actual in-memory SQLite with D1-shaped
prepared statements, plus typed client parsing tests. The PR adds mandatory
Foundation tests and a signed-out real-Chrome route check. They are not a claim
that authenticated acceptance against remote D1 has passed.

Before activation: review and merge R2 first; retarget/revalidate this stacked PR;
review backup/restore and the exact preview D1 migration ledger; approve and apply
0009 separately; register it in the ledger; verify two real test-member sessions,
reload/reopen/racing saves, sign-out/account switching, export and deletion on
the approved preview; inspect desktop/390px/320px behavior and keyboard controls.
Production source gate/config changes require a separate reviewed release.

Authoritative implementation references: Cloudflare D1 prepared statements and
batch API (developers.cloudflare.com/d1/worker-api/d1-database/); Better Auth
user deletion callbacks (better-auth.com/docs/concepts/users-accounts).

# ANEVUM Member Command — production release and operator gates
Date: 2026-10-08 | Canonical issue: anevum/anevum-web#210

## Product and current evidence

ANEVUM is an independent software workshop. Its authenticated Command member portal supplies personal profiles, saved programs, followed projects, and available application features. RHEN is the first project. The general member RHEN evidence/research workspace is NOT a brokerage terminal and has no trade-write authority. The founder's RHEN Terminal remains a separate operator-only authorization domain.

Google OAuth staging is deployed on https://anevum-member-staging.devonakins.workers.dev and connected ONLY to the preview D1 database. The [staging deployment run](https://github.com/anevum/anevum-web/actions/runs/37859203656) verified auth readiness, distinct D1, anonymous member denial, and owner API denial. The owner reports testing two independent Google accounts, separate profiles/saves, logout, export, deletion. This is OWNER-REPORTED acceptance, not independently executed two-cookie testing. Full adversarial expiry/CSRF/rate-limit coverage remains a separate gate.

## Command Access scope cutover

Before the cutover, the existing Access application protects anevum.com/command* and anevum.com/api/command*. It has an owner-only policy, an expected fixed application ID and Access AUD.

After the cutover, its ONLY protected destinations are:
- anevum.com/command/rhen* — private RHEN Terminal and subroutes
- anevum.com/api/command* — private RHEN operator APIs including live actions

The root /command is the normal member page and is not behind Cloudflare Access. An ordinary member login alone NEVER grants a verified operator JWT, broker access, or permissions to private terminal routes. /me remains an alternative member entry.

The Worker now sends legacy operator URL aliases to the protected /command/rhen subtree before delivering the public SPA. Unknown /api/command/* endpoints fail closed rather than rendering an HTML page.

The new command-access-member-cutover workflow runs ONLY after a successful main-branch production website deployment. It audits the current Access app ID, AUD, policy and identity; refuses unexpected path/policy drift; checks that /me and private routes work; then PATCHes only the same app's destinations. It checks that the member root returns HTTP 200, legacy operator URLs redirect server-side, private RHEN operator paths still require Access, and private APIs still deny anonymous access. On a failed live check it attempts to restore the previous broader Access scope. If the Access API token is read-only or this cannot be verified, treat the cutover as incomplete and inspect the run; do not bypass Access to solve it. Verify Command Access accepts only the exact old or new path set during the change.

## Production D1 — explicit manual approval

The production D1 database is anevum-members, UUID 7f0d4c0c-2e85-4900-8504-1347954e1df1. Preview D1 is anevum-members-preview, UUID a537432e-d216-4b31-8b22-19662cc3a44a.

The GitHub workflow member-production-d1-migrate.yml is MANUAL ONLY. It requires owner confirmation of policy review, staging security, and production Google OAuth/secret handling plus the explicit phrase MIGRATE_PRODUCTION_MEMBER_DB. Before any mutation it verifies both database UUIDs, the production Worker flag still disabled, three encrypted production auth-secret NAMES (never values), and a clean 0-or-9-table schema state. It migrates production D1 only, confirms nine tables and zero foreign-key violations, then verifies real production signup remains unavailable. This workflow NEVER enables production signup and NEVER touches RHEN.

If the owner has not reviewed Privacy and Terms or has not privately rotated any chat-exposed production Better Auth secret, do not run migration.

## Privacy and Terms review

The code handles Google name, email and linked account identifiers, optional profile image, encrypted provider tokens, sessions and session security metadata, profile preferences, saved apps, follows and entitlements. JSON export and active-record deletion are implemented; the provider log/backup deletion period is not established from source.

The Privacy and Terms draft pages now describe current behavior and remain visibly DRAFT for the owner to approve. Do not promise fixed provider retention periods, investment returns, brokerage access, or a paid service that does not exist. Remove the draft warnings only after owner review of actual processes, retention and applicable jurisdiction.

## Final release gates before public registration

1. Confirm separately that two real staging accounts pass isolation, deletion/export, expired-session, invalid Origin, CSRF and rate-limit checks. The two-cookie staging script may run only with session cookies supplied through a protected local runtime, not ChatGPT, public CI, or repository files.
2. Confirm the live Command Access audit reports scoped member mode while the RHEN Terminal and APIs still demand owner-only Access. Revisit legacy links and verify redirects.
3. Obtain explicit owner approval for current Privacy and Terms, including actual deletion/backups/log retention.
4. Confirm production Google OAuth client origin https://anevum.com and callback https://anevum.com/api/auth/callback/google; three encrypted production Worker secret names; private rotation of the previously chat-exposed production auth secret.
5. Run the manual production D1 migration workflow and obtain its nine-table and FK success evidence.
6. In a separate, reviewed production activation change, enable ONLY production member registration flag, preserve distinct preview, and verify live OAuth, member data isolation, logout/deletion/export, and private RHEN authorization. Never silently enable public registration from a website CSS/copy/access change.

Rollback on any failure: disable the production membership flag, and for Access failures restore the prior owner-only broader destinations. Avoid touching RHEN order execution or Railway live service.

## Implemented files and audits

- src/server/operator-routes.mjs and worker.mjs: server-side legacy alias forwarding and private API fail-closed.
- tests/member-command-cutover.test.mjs: route boundary tests.
- scripts/command-access-cutover.py: reversible, owner-only Access scope change.
- tests/test_command_access_cutover.py: verifies exact allowed paths/identity and rejects drift.
- .github/workflows/command-access-member-cutover.yml: production post-deploy scoped cutover.
- .github/workflows/verify-command-access.yml: accepts only exact old or new paths and tests protected traffic.
- .github/workflows/member-production-d1-migrate.yml: approval-gated isolated production DB migration.
- Issue #210: canonical rollout, approvals and evidence.

No new Railway runtime, Supabase, crypto, payment/reward authority, or live trading permissions are part of this release.

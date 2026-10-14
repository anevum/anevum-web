# ANEVUM V013 — isolated canonical Better Auth staging candidate

Session: ANEVUM.WEB.BUILD.2026-10-14.009.CANONICAL-AUTH-STAGING-CANDIDATE
Base: V012 draft PR #400 (exact-head CI passed)
Branch: build/creator-v1-canonical-auth-staging-v013-20261014
Status: SOURCE REVIEW ONLY. NOT DEPLOYED. NO DATABASE, ROUTING, SECRET, AUTH PROVIDER OR USER CHANGED.

## Product purpose

Establish the groundwork for a SINGLE canonical member login on a.anevum.com without inheriting the separate V5 Better Auth account, existing next.anevum.com Creator V1 email-OTP account, RHEN founder terminal or any privileged staff session. The service uses the repository's pinned Better Auth 1.7.5 with a dedicated cookie prefix and Google only. Other proposed login methods remain unavailable.

Critical compatibility gap: the V011 Community MemberGate and Join UI still depend on the older Creator V1 email-code member contract at /api/v1/member/me. V013 does NOT implement or impersonate this API, does NOT link accounts and DOES NOT provide Creator V1 profiles. Mounting this candidate before a separately reviewed canonical-to-Creator member adapter would break member features. No public registration should be advertised.

## Added source

- creator-v1/canonical-auth/policy.mjs: exact https://a.anevum.com origin; fixed host-scoped cookie prefix, dedicated issuer and method allowlist, foreign-cookie/Authorization stripping, explicit disabled-by-default environment gating and on-request D1 schema checks. New accounts require two or more distinct invited test emails and reject protected owner/operator emails.
- creator-v1/canonical-auth/auth.mjs: independent Better Auth factory with Google only, disabled password signup, explicit disableSignUp and disableImplicitSignUp when the pilot is closed, before-create DB hook that denies every uninvited new identity, no implicit provider linking, encrypted OAuth tokens, database-backed state/rate limits and exact trusted origin.
- creator-v1/canonical-auth/worker.mjs: host-only handler for health, advertised sign-in methods, Better Auth get-session, Google callback, Google sign-in and sign-out. All writes require same-origin Origin and fetch-metadata checks. Provider request body is bounded and sanitized to an on-site callback only. Unlisted member, staff, user management, email, GitHub, RHEN, admin and Creator V1 API routes do not exist. No CORS account grants.
- creator-v1/canonical-auth/migrations/0001_canonical_better_auth_core.sql: standalone new-D1-only Better Auth core tables user, session, account, verification and rateLimit plus a unique fixed canonical_identity_manifest issuer marker, without Creator profiles, XP, RHEN or member privileges. The Worker checks that marker on each auth request so accidentally pointing MEMBER_DB at an older V5 D1 with superficially compatible Better Auth tables will fail closed.
- creator-v1/wrangler.canonical-stage.candidate.jsonc: deliberately DISABLED and UNROUTED, with no live D1 binding, workers_dev false, preview_urls false and all feature flags false. Merely committing this file cannot open registration.
- creator-v1/test/canonical-auth-worker-v013.test.mjs: source and actual in-memory SQLite safety tests for config, session boundary, allowed methods, owner/invite restrictions, cookie rejection, forged OAuth input, cross-site denial, callback, missing schema and separate schema uniqueness/deletion.

## Identity and resource isolation

The new canonical MEMBER_DB must eventually be a **brand-new and separately approved isolated D1**. Do NOT use the current Creator V1 staging D1 fa96e36d-6257-4883-bf15-074947e11a13, Creator preview D1 6c7b5f0c-33db-4b6a-9569-0a6af5e07534, old V5 preview D1 b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf, or any current anevum-members database without an independent audit.

Proposed exact OAuth callback, only after a separate Google OAuth app is approved:
https://a.anevum.com/api/v1/member/auth/callback/google

No cross-subdomain cookie sharing, automatic email/handle matching, transferring of sessions or implicit founder/admin/RHEN permissions.

## Source-only activation guards (not provisioned)

Disabled: ANEVUM_CANONICAL_STAGE_ENABLED, CANONICAL_SCHEMA_APPROVED, CANONICAL_GOOGLE_ENABLED and CANONICAL_INVITED_SIGNUP_ENABLED.
Absent secrets: CANONICAL_BETTER_AUTH_SECRET, CANONICAL_GOOGLE_CLIENT_ID, CANONICAL_GOOGLE_CLIENT_SECRET, CANONICAL_PROTECTED_EMAILS and CANONICAL_INVITE_EMAILS.

All conditions must be validated with an independently reviewed route and D1 inventory. Secret/flag presence does not imply a deployment is approved.

## Required next work

1. Review Better Auth 1.7.5 configuration, callback/state/cookie/rate controls, database schema and owner-email protection. Keep OAuth scopes limited to email/profile.
2. Owner approves and provisions a brand-new isolated test D1; test migration 0001 and database backup/restore first. No Creator V1 migration 0015 applied until linking ceremony is complete.
3. Test this candidate on an isolated non-public Worker with one explicit Google pilot, verified email, separated host cookies, login/logout, replay and rate restrictions, and no uninvited registration.
4. Build a separate server-side canonical-to-Creator membership adapter requiring two verified independent sessions and user consent, nonce, signed single-use proof, no duplicate mapping, recovery, deletion and rollback.
5. Migrate Community MemberGate and Join only after the adapter is secure; test real Member A, independent Member B, separate staff reviewer, published-only anonymous catalogue, XP/awards, original creator ownership and no account leaking.
6. Re-run V012 live-topology evidence gate, owner UX acceptance at 1440/1024/390/320, full staging recovery and explicit owner authorization before touching a.anevum.com/api/v1/member/*.
7. Preserve the anevum.com construction terminal for January 1, 2027. Do not affect RHEN, Command, private Lab or brokerage accounts.

V013 passing source CI is NOT evidence of real Google sign-in or hosted staging accounts. No deploy, merge, migration, user creation, OAuth credential changes, emails, route changes or permission changes are authorized by this source increment.

# ANEVUM.WEB.BUILD.2026-10-08.010.MEMBER-ACTIVATION-VERIFICATION

Continuation of issue #210. This is a fail-closed activation workstream; it does not mean membership is live.

## Identity boundaries
Cloudflare Worker+D1 stores member identities and preferences. Cloudflare Access separately protects RHEN operator endpoints. An ordinary member never gains broker-write rights. RHEN Railway production is not part of this change.

## Configuration gates
Run `node scripts/verify-member-bindings.mjs` in the intentionally unconfigured/disabled state.
After creating real, distinct D1 database UUIDs, run `node scripts/verify-member-bindings.mjs --require-config` to ensure production, preview Worker, and preview-migration config are separate and consistent. `--require-live` additionally requires the production source flag enabled, but cannot substitute for live authentication tests.
Preview migrations config, when created, must be named `wrangler.preview-migrations.jsonc` and target only the database `anevum-members-preview`. No placeholder UUIDs, Worker secrets, or staging auth flags belong in production source.

## Two-account staging check
Create two distinct disposable Google staging accounts after OAuth is configured. Supply `ANEVUM_TEST_ORIGIN`, `ANEVUM_TEST_COOKIE_A`, and `ANEVUM_TEST_COOKIE_B` via protected environment variables, never commit cookies or paste them into logs. Run `node scripts/verify-member-staging.mjs` for read-only assertions. Use `--exercise-writes` only in staging to test save persistence and restore initial saved-app state.
This check rejects the production origin; verifies distinct sessions and account exports; denies anonymous requests, cross-origin writes, and ordinary-member access to protected RHEN APIs. Browser OAuth nonce/state, expiration, account deletion, and entitlement verification still need independent manual or browser-based tests.

## Activation order
1. Provision separate D1 production and preview databases with Cloudflare D1 Write permission. Record verified UUIDs.
2. Bind and migrate preview, set distinct preview origin, Google callback, and Worker secrets.
3. Validate OAuth login/logout, account export/deletion, cross-member isolation, sessions, Origin/CSRF enforcement, and protected terminal access with two real staging identities.
4. Confirm privacy and terms content is approved for real signup.
5. Migrate/configure production with its own credentials and DB; preserve Cloudflare Access protection on `/command/rhen/*` and `/api/command/*` while allowing ordinary member Command access.
6. Explicitly activate ANEVUM_MEMBERS_ENABLED only after checks; verify production signup, logout and deletion; advertise available apps only if accessible.

Personal brokerage OAuth, individual bot configuration, and funding/rewards are distinct follow-on projects; member identity must not imply those capabilities exist.
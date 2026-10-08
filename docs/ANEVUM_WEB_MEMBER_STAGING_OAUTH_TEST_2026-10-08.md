# ANEVUM member staging OAuth activation and two-user acceptance
Date: 2026-10-08 | Workstream: anevum/anevum-web#210

## Scope and authorization

This change enables **only the dedicated staging Worker** `anevum-member-staging` for genuine Google OAuth testing. The owner confirmed distinct Google staging client credentials and a separate `BETTER_AUTH_SECRET` have been entered into Cloudflare encrypted Secret bindings for that Worker. GitHub cannot inspect the values; deploying the code does not itself prove they were entered correctly.

Production `anevum-web-nextgen` keeps `ANEVUM_MEMBERS_ENABLED=false`, `ANEVUM_MEMBER_PREVIEW_ENABLED=false`, and its original production D1 binding. Production D1 remains unmigrated. The live RHEN Railway trading service, brokerage execution, Cloudflare Access and `/api/command/*` authorization are not changed.

## Exact staging config

`wrangler.member-staging.jsonc`:
- Worker: `anevum-member-staging` on `https://anevum-member-staging.devonakins.workers.dev`
- `MEMBER_DB`: `anevum-members-preview` (UUID `a537432e-d216-4b31-8b22-19662cc3a44a`), with the already verified preview-only migration.
- Staging vars: `ANEVUM_MEMBERS_ENABLED=true`, `ANEVUM_MEMBER_PREVIEW_ENABLED=true`, `MEMBER_PREVIEW_ORIGIN=https://anevum-member-staging.devonakins.workers.dev`.
- Encrypted staging Worker secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, never in GitHub, logs, or chat.
- No production routes, no live Command stream, no private RHEN Access credentials, no brokerage authority.

The repository guard verifies the **build-time and Vite-generated** Worker identities, exact verified staging origin, preview D1 UUID, disabled production flags, and absence of leaked secret values.

## Google staging client configuration

In Google Auth Platform → Clients, **ANEVUM Staging** (Web application):
- Authorized JavaScript origin: `https://anevum-member-staging.devonakins.workers.dev`
- Authorized redirect URI: `https://anevum-member-staging.devonakins.workers.dev/api/auth/callback/google`

Keep the Google Auth Platform app **Testing** and add two distinct Google accounts to Audience → Test users. This is separate from the production `ANEVUM Website` OAuth client.

## Automated staging readiness checks (no test credentials required)

On the merged staging-only deploy:
1. Confirm `GET /api/member/availability` returns HTTP 200 with `{"available":true,"provider":"google"}`. A false result means a missing secret, origin mismatch, or unavailable schema; **do not claim OAuth working**.
2. Confirm anonymous `GET /api/member/me` returns HTTP 401.
3. Confirm anonymous `GET /api/auth/get-session` responds HTTP 200.
4. Confirm `GET /api/command/trader/status` without Cloudflare Access returns HTTP 401.
5. Confirm the staging page is `noindex, nofollow, noarchive`.

The GitHub workflow never prints secret values or session cookies. **Readiness checks do not prove a real Google OAuth redirect, browser cookie behavior, or two-user isolation.**

## Manual two-account acceptance required before production consideration

1. Open `https://anevum-member-staging.devonakins.workers.dev/sign-in` in a private browser window; use the first Google test account. Verify consent, callback to `/me`, and that `/me/settings` reflects only that account.
2. Sign out; verify accessing `/me` and `/api/member/me` as a guest cannot read private data.
3. In another private browser session, repeat with second Google test account; verify two different member identities and that saved projects, follows, profile themes, exports and deletion never cross members.
4. Verify no ordinary Google account can access private operator `/command/rhen/*` or `/api/command/*`. Do not enable or exercise RHEN broker-write authority during testing.
5. Test failed OAuth redirect/state, expired sessions, CSRF/origin rejection, rate limiting, JSON export and account deletion. Use disposable Google accounts for deletion.
6. Run `scripts/verify-member-staging.mjs` with **two real cookie values via protected local environment only** (never send cookies to ChatGPT or commit them). Use `--exercise-writes` only on the staging Worker. Do not claim this script passes until it actually runs.
7. Document findings and review and approve privacy and terms before any production D1 migration or enabling public registration.

## Rollback

If any staging security check fails after deploy, revert only `wrangler.member-staging.jsonc` to both flags `false` and delete `MEMBER_PREVIEW_ORIGIN`; restore `scripts/verify-member-staging-deploy.mjs` and the staging workflow's disabled-state assertions in the same PR. Re-deploy **staging only**. Do not change the production Worker to troubleshoot staging.

**Do not publish a claim that ANEVUM accounts are live until the full two-account staging acceptance is verified.**

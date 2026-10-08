# ANEVUM member staging bootstrap — isolated Google OAuth test environment
Date: 2026-10-08

## Goal and currently safe state

GitHub issue #210 governs member activation. Two distinct D1 databases already exist. Production `anevum-members` (`7f0d4c0c-2e85-4900-8504-1347954e1df1`) remains unmigrated; only preview `anevum-members-preview` (`a537432e-d216-4b31-8b22-19662cc3a44a`) has a verified nine-table member schema.

The independent Cloudflare Worker `anevum-member-staging` uses **only preview D1**, a distinct `workers.dev` hostname, no `anevum.com` route, no private RHEN operator authorization, no live Command stream, and no checked-in secrets. At bootstrap, both `ANEVUM_MEMBERS_ENABLED=false` and `ANEVUM_MEMBER_PREVIEW_ENABLED=false`. Authentication and public signup must remain unavailable until the separately reviewed staging-activation change.

## Build/deploy verification

The Cloudflare Vite plugin supports `CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH=wrangler.member-staging.jsonc` as the *build-time* config source. The build generates a separate deploy configuration. The staging guard verifies both the checked-in and generated configs (including Worker name, actual preview UUID, no production routes, and disabled signup) before deployment. Never deploy a production Vite bundle using `wrangler deploy --config ...` as a substitute for this separate build.

The workflow `.github/workflows/member-staging-bootstrap.yml` runs tests on PRs, and on merge deploys only `anevum-member-staging`. It checks unauthenticated member availability, denial of operator APIs, and search-index exclusion. The deployed stable origin and exact redirect URI appear in the successful workflow run summary. No OAuth credentials or secrets are printed.

## Cloudflare credential correction

A previous `BETTER_AUTH_SECRET` value appeared in a chat response and must **not** be relied on as a private live auth secret. Rotate it in the production `anevum-web-nextgen` Worker using a newly and privately generated 64+ character password-manager string before signup. Production remains disabled meanwhile. Generate a **different** private `BETTER_AUTH_SECRET` for staging. Do not copy passwords into chats, screenshots, code, GitHub comments, or logs.

## Google staging OAuth — after getting the real staging origin

1. In the ANEVUM Google Cloud project, create a **separate OAuth Web application client** named `ANEVUM Staging`. Keep Google Auth Platform Audience in **Testing** and add the intended test-user Google accounts.
2. Authorized JavaScript origin: `<verified workers.dev staging origin>`.
3. Authorized redirect URI: `<verified workers.dev staging origin>/api/auth/callback/google`.
4. In Cloudflare → Workers & Pages → **anevum-member-staging** → Settings → Variables and Secrets, add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `BETTER_AUTH_SECRET` as encrypted **Secret** values for the **staging Worker**, not `anevum-web-nextgen`. This is separate from the credentials already added to the production Worker.
5. Obtain the user's confirmation that staging secrets are saved; verify actual staging Worker hostname before activation.
6. In a separate reviewed PR, set `ANEVUM_MEMBERS_ENABLED=true`, `ANEVUM_MEMBER_PREVIEW_ENABLED=true`, and `MEMBER_PREVIEW_ORIGIN` to the **exact** verified HTTPS staging origin **only in the staging config**. Never modify the production top-level `wrangler.jsonc` member gate, or bind preview D1 to production.
7. Inspect the deployed `/api/member/availability`. Perform real Google login with **two independent test identities**, logout, session expiry, Origin/CSRF protections, member export and deletion, cross-account data isolation, and operator `/api/command/*` denial. Run `scripts/verify-member-staging.mjs` using locally supplied secret session cookies and don't put those cookies in CI logs or chat. Validate OAuth state and secure cookie behavior manually.
8. Only after verified staging tests, privacy/terms approval, and Cloudflare Access route review may production D1 be migrated and production signup considered for explicit activation. Brokerage OAuth, member bots, payments, and rewards are independent projects.

## No effect on RHEN trading

This workflow does not change live Railway RHEN, its order path, strategy state, the ANEVUM production website routing, or the existing Cloudflare Access-protected terminal paths. Only the isolated staging Worker is created.

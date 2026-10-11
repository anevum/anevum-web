# ANEVUM V5 — independent non-trading beta environment

Session: ANEVUM.WEB.BUILD.2026-10-11.010.ISOLATED-BETA-DEPLOYMENT
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Incremental source parent: V5 WEB #307, commit 9bd3324a732cd2df0a798f3da2f75040e08eedf9.
Owner approved **separate beta staging** on October 11, 2026. This is NOT approval to modify production, change Alpaca reviewer staging or activate live brokerage.

## Cloudflare resources actually provisioned — October 11

| Resource | Identity | State |
| --- | --- | --- |
| Dedicated Worker | anevum-v5-beta | Created, not the production or Alpaca reviewer Worker |
| Beta URL | https://anevum-v5-beta.devonakins.workers.dev | Workers subdomain enabled; public URL may be reachable but not independently HTTP acceptance-tested |
| Dedicated D1 | anevum-v5-beta-members, b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf | Created, with empty member/account data |
| Beta authentication secret | BETTER_AUTH_SECRET on anevum-v5-beta | Independently generated and stored only as a Cloudflare secret; never printed or committed |
| Beta Google OAuth | GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | **Not provisioned** |
| Beta Worker source currently deployed | Minimal non-trading holding page | HTTP 503, private no-store, noindex; NOT the full V5 React/Worker website |

The new D1 has **only** the existing source migrations 0001 through 0004,
verified in Cloudflare D1's own migration ledger; there are zero members,
profiles, workspaces, drafts and billing subscriptions. Foreign key check
returned zero violations. Cloudflare's direct D1 API did not authorize
PRAGMA integrity_check (SQLITE_AUTH); do not misreport that as a passed check.
The 0003 billing tables exist for ordered historical migration compatibility;
the beta has no billing, checkout, funding or brokerage permissions. Alpaca
review migration 0005 and social posting/moderation migrations 0006/0007 are
not applied. No active production or reviewer D1 data was copied to beta.

Cloudflare production Worker anevum-web-nextgen and existing reviewer
Worker anevum-member-staging remain unchanged, including their D1 bindings.
The beta Worker has NO imported Google client secret, broker keys, paid
billing credentials or company owner/operator credentials.

## Prepared source to publish actual V5 beta

- wrangler.v5-beta.jsonc uses only the fresh beta D1 and exact beta URL.
  Member profiles, saving/following, RHEN_NEXT workspaces and non-executing
  bot drafts are beta capabilities once an authenticated Google member exists.
  Owner PAPER, Alpaca Connect, public Commons posting and live RHEN streams
  remain false.
- scripts/verify-v5-beta-deploy.mjs compares source and Vite-generated
  Wrangler deployment targets against the known production/reviewer database
  UUIDs, exact flags, route absence and sensitive secret names. A drift fails.
- .github/workflows/v5-isolated-beta-deploy.yml builds/tests PRs without
  deployment. **Only** a manually approved current-main workflow_dispatch
  with exact SHA and DEPLOY_ISOLATED_V5_BETA_ONLY can deploy a verified
  generated Worker to anevum-v5-beta. It checks independent D1 schema 0001–0004,
  foreign keys, existing beta script bindings/secret name, and postdeploy
  anonymous account denial. It does not run D1 migrations or any broker call.
- /me/verify, browser workspace acceptance and the read-only two-account
  acceptance script now permit the **two exact** authorized origins:
  legacy reviewer staging and this separate beta URL. Neither permits
  anevum.com, arbitrary workers.dev origins, HTTP or selected-account URLs.
- PR source, full verification and approval are distinct from an actual
  deployed and user-verified beta. No automatic merge/deploy was authorized.

## Beta Google login activation (owner action, no values in chat)

Use a separately authorized Google Cloud OAuth web client for this beta.
Add **exactly** the following entries to that client:

Authorized JavaScript origin:
https://anevum-v5-beta.devonakins.workers.dev

Authorized redirect URI:
https://anevum-v5-beta.devonakins.workers.dev/api/auth/callback/google

Provision GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as Cloudflare encrypted
secret bindings on **anevum-v5-beta**, not the reviewer or production Worker.
Do not paste values into GitHub issues, source control, chats or account
exports. Never copy the existing preview database, sessions, Google refresh
tokens or production Better Auth secret. This new Worker already has its own
fresh BETTER_AUTH_SECRET. Do not rotate it casually after real users register.

After an owner-reviewed V5 source commit is merged to main, run the isolated
beta manual deployment workflow with its *current exact reviewed main SHA*.
The workflow must report the beta origin and no production/reviewer changes.
Google sign-in must remain unavailable if Google bindings are missing.

## Required acceptance before real testers are invited

1. Confirm exact-head V5 CI and isolated beta release preflight are green.
2. Confirm new Worker asset routes render /, /beta, /sign-in, /me/beta,
   /me/verify, /apps/rhen and /me/settings on mobile and desktop.
3. In two independent browser profiles with different Google test accounts,
   register, return from Google to /me/beta, reload and sign out/back in.
4. Check each account's private profile, saved projects, follows, separate
   RHEN workspace, non-executing bot drafts and account export. The workspace
   codes must differ; the server-side cross-user denial test must also pass.
5. Verify anonymous and unrelated members cannot read member state, edit
   another member's draft, use company Command or obtain broker permissions.
6. Test deletion only with a disposable account and verify another member's
   records persist. Review privacy, terms, moderation scope, support and
   incident/rollback plan.
7. Confirm beta backup and restore readiness, costs and intended test
   population; the existing disposable remote-D1 recovery workflow must be
   separately approved if it will transfer private preview data to a fresh
   remote D1. Do not silently reuse the old preview backup in this beta.
8. Record the explicit owner's go/no-go for inviting external testers. The
   public V5 production cutover remains a separate release decision.

**Rollback:** Only replace the isolated anevum-v5-beta Worker with the
non-trading holding page or a prior reviewed beta version. Never delete an
active members D1 database during rollback. Retain the beta's account
data, encryption key and migration ledger for diagnosis and recovery.

## Boundary

This environment is for independent V5 website/member experience, not a
copy-trading firm or broker. ANEVUM's company trading account, founder
personal member/PAPER smoke test and other members' private accounts are
separate. No actual order routing is unlocked by registration, RHEN drafts
or having a private workspace. Alpaca Connect approval is **not** a
dependency for this non-trading beta.

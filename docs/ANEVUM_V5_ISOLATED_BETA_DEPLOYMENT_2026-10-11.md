# ANEVUM V5 — independent non-trading beta environment

Session: ANEVUM.WEB.BUILD.2026-10-11.010.ISOLATED-BETA-DEPLOYMENT
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Incremental source parent: V5 WEB #307, commit 9bd3324a732cd2df0a798f3da2f75040e08eedf9.
Owner approved **separate beta staging** on October 11, 2026. This is NOT approval to modify production, change Alpaca reviewer staging or activate live brokerage.

## Cloudflare resources actually provisioned — October 11

| Resource | Identity | State |
| --- | --- | --- |
| Dedicated Worker | anevum-v5-beta | Full V5 Worker deployed October 11, 16:13 UTC; separate from production/reviewer |
| Beta URL | https://anevum-v5-beta.devonakins.workers.dev | Public HTML routes HTTP 200; sign-in available, external invitations still closed |
| Dedicated D1 | anevum-v5-beta-members, b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf | Created, with empty member/account data |
| Beta authentication secret | BETTER_AUTH_SECRET on anevum-v5-beta | Independently generated and stored only as a Cloudflare secret; never printed or committed |
| Beta Google OAuth | GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Both encrypted bindings confirmed; live non-authenticating Google authorization initiation passed |
| Beta Worker source currently deployed | Full V5 React/Worker bundle | Deployed version ae2ea588-4dab-4216-bef2-03323c298a1a from approved source a5fd820840501c897031a08d6812103ed3c7c743 |

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
The beta Worker has its own encrypted Google ID/Secret and separate Better
Auth secret; none was copied from production. No broker keys, paid billing
credentials or company owner/operator credentials were provisioned.

## Released beta source and isolated deployment pipeline

- wrangler.v5-beta.jsonc uses only the fresh beta D1 and exact beta URL.
  Member profiles, saving/following, RHEN_NEXT workspaces and non-executing
  bot drafts are beta capabilities once an authenticated Google member exists.
  Owner PAPER, Alpaca Connect, public Commons posting and live RHEN streams
  remain false.
- scripts/verify-v5-beta-deploy.mjs compares source and Vite-generated
  Wrangler deployment targets against the known production/reviewer database
  UUIDs, exact flags, route absence and sensitive secret names. A drift fails.
- .github/workflows/v5-isolated-beta-deploy.yml builds/tests PRs without
  deployment; the original reviewed-main manual deployment route remains.
  For the initial isolated beta-only release, the exact reviewed source passed
  four independent GitHub checks, then a one-time marker-triggered workflow
  .github/workflows/v5-beta-approved-branch-release.yml deployed only
  anevum-v5-beta. The release action's final postdeploy check reported failure;
  follow-up read-only live checks confirmed correct availability, anonymous
  denial and separate D1 bindings. A later workflow correction compares
  actual protected Worker bindings and deployment versions rather than all
  incidental metadata. No D1 migrations or brokerage requests ran in release.
- /me/verify, browser workspace acceptance and the read-only two-account
  acceptance script now permit the **two exact** authorized origins:
  legacy reviewer staging and this separate beta URL. Neither permits
  anevum.com, arbitrary workers.dev origins, HTTP or selected-account URLs.
- The full beta Worker is deployed and its anonymous HTTP contracts passed.
  This is NOT evidence of completed Google login, persisted member accounts,
  two-user isolation or authorization to invite external testers. PR #309
  remains unmerged and production remains on its existing deployment.

## Beta Google login — configured; real member acceptance still outstanding

Use a separately authorized Google Cloud OAuth web client for this beta.
Add **exactly** the following entries to that client:

Authorized JavaScript origin:
https://anevum-v5-beta.devonakins.workers.dev

Authorized redirect URI:
https://anevum-v5-beta.devonakins.workers.dev/api/auth/callback/google

GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are now provisioned as encrypted
bindings on **anevum-v5-beta** only, alongside its own BETTER_AUTH_SECRET.
The live /api/member/availability endpoint returned
{available:true,provider:"google"}; a bounded POST to
/api/auth/sign-in/social returned a Google authorization URL using the exact
beta callback and an OAuth state. This initiation did NOT follow the redirect,
complete authentication, register a member or authorize brokerage access.
Never paste the Google values into GitHub, chat, logs or account exports.
Do not rotate the Better Auth secret casually once accounts exist.

If the Google OAuth consent screen remains in Testing status, the owner must
configure the intended Google test users and use two independent browser
profiles for the first real-account acceptance. No user cookies or exports
should be shared. Actual Google callback and session persistence remain
unverified until that test succeeds.


## October 11 live controlled-beta acceptance checkpoint

The **deployed** V5 beta Worker and Google OAuth initiation are now independently
verified. The initial one-time branch release action deployed version
ae2ea588-4dab-4216-bef2-03323c298a1a (source parent a5fd8208). Its
post-deployment step returned failure without identifying an endpoint.
Follow-up CI performed a live read-only probe with confirmed status:
\`/api/member/availability\` HTTP 200 and \`{available:true,provider:"google"}\`;
\`/\`, \`/beta\`, \`/sign-in\`, \`/me/beta\` HTTP 200; the five private member and
operator routes HTTP 401 without credentials. All three Worker D1 bindings
remain distinct. The new non-authenticating OAuth POST produced Google's
HTTPS authorization route, exact beta callback, standard code flow, and state
without logging the authorization URL or creating a member.

Cloudflare's own read-only beta D1 aggregate check now reports **one**
email-verified Google member, one linked Google account, one session, one
independent RHEN workspace, one non-executing draft, and no orphaned
workspace. These counts show a real account record was persisted but do
**not** identify which person created it or prove two-user isolation.
No raw identity, email, access/refresh token, session cookie, or member
export was read into this checkpoint.

\`scripts/v5-beta-two-member-aggregate-audit.mjs\` supplies a reusable,
strictly read-only **prerequisite** test against the exact beta D1 UUID. It
checks aggregate verified Google membership and ownership of two distinct
workspaces, with no orphaned or duplicate workspace IDs. It emits only
bounded counters/statuses, never member identity or brokerage data. This
does not replace two actual Google sign-ins, private session checks,
persistent drafts/exports, cross-member API denial, or separate owner
approval for invitations. Source tests enforce this distinction.

The live Worker is still the originally authorized deployed code; later
source-only corrections to protected Worker version comparison and
aggregate acceptance checks are **not** themselves an additional deployment.
Neither production nor Alpaca reviewer Worker was redeployed.

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

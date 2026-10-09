# ANEVUM.WEB.BUILD.2026-10-08.007.PER-USER-RHEN-TERMINALS

**Status:** PR implementation / non-executing member terminal; owner dual-auth CUTOVER NOT YET ENABLED.  
**Source of authority:** [GitHub issue #235](https://github.com/anevum/anevum-web/issues/235) and the owner's October 8 decision.  
**Related:** [member OAuth infrastructure issue #210](https://github.com/anevum/anevum-web/issues/210).

## Locked product boundary

ANEVUM Command (/command) belongs to the signed-in website member. The first RHEN member app is under /apps/rhen. Every member's *personal* RHEN Terminal is /apps/rhen/terminal. No member terminal may redirect into ANEVUM's company RHEN account or inherit the owner's positions, orders, equity, performance, bot configuration, research internals, or broker authentication.

The existing company/operator RHEN Terminal stays at /command/rhen/*. It remains attached to the existing RHEN service and company Alpaca account. Only the one verified owner ANEVUM member account may be associated with this terminal, and only when a separate Cloudflare Access owner assertion is also valid. Merely being logged into Google, knowing an account email, owning a paid entitlement, or having a cached Cloudflare Access session cannot confer ownership.

**No change to the production RHEN Railway service, live order path, strategy/research gates, or existing company brokerage account is part of this PR.**

## First release in this branch

- /apps/rhen/terminal now renders a member-scoped, inert RHEN Terminal, rather than redirecting to /command/rhen/operate.
- /api/member/rhen/terminal uses the server-resolved Better Auth session's user ID. It returns a read-only, no-store, noindex readiness contract. No client-supplied tenant/account ID, Alpaca credential, P/L, broker positions, orders, global RHEN status or company data is returned. All personal brokerage and trading capabilities remain false.
- Member Command and RHEN navigation checks the owner-member ID before it even attempts the separate Cloudflare Access operator session check. This stops showing company links to a signed-in ordinary member that shares a browser with a cached owner Access cookie.
- The Worker has an optional dual-auth enforcement mode on **every** existing private company API credential path (REST reads, mutations, research history/bootstrap, private WebSocket, and /api/command/session). It validates the company Cloudflare Access JWT as before and, under strict mode, also checks immutable Better Auth `user.id`, verified member email state, and the separately pinned Access email. Strict mode additionally gates the operator HTML shell.
- While strict mode is off, if an owner-member ID is configured and a different member session is actually present, the private API rejects that member even though the browser might have an owner Access cookie. If no owner-member ID has yet been configured, the current owner-only Access path is unchanged.
- Tests cover owner ID mismatch, same-email impersonation, false email verification, wrong Access identity/source, cached owner Access with member B, no-value contracts, route separation, feature flag, and protected API entry points.

## Staged owner binding and cutover (manual, do not infer completion)

1. Deploy the approved code **with `ANEVUM_OWNER_TERMINAL_DUAL_AUTH=false`**. Verify the existing company Terminal still works behind Cloudflare Access. No public terminal links or broker integrations become active.
2. Owner signs into the **production** ANEVUM Google member account. The server-generated immutable account identifier is available in the private /api/member/session or export response. Confirm identity in a private browser session. Do not hardcode it in Git or accept an arbitrary email/display name as proof. Owner must validate that this account is the intended company owner.
3. Privately provision two encrypted Cloudflare Worker secrets on `anevum-web-nextgen`, **not** on the staging Worker: `ANEVUM_OWNER_MEMBER_ID` (exact Better Auth user.id) and `ANEVUM_OWNER_ACCESS_EMAIL` (the expected, separately verified Cloudflare Access owner email from the currently approved Access policy). Neither secret value belongs in Git, chat, or CI logs. Do not infer equality between Google and Access email.
4. With dual-auth flag still false, verify owner Google + owner Access shows the company link and accesses read-only company status. Verify member B + cached owner Access returns 403 and sees only a disconnected personal terminal. Verify owner Google without Access, no member cookie, expired member session, invalid Access, and member B without Access are denied or challenged. Check logs without exposing cookies.
5. In a **separate approved release**, after the owner dual-login acceptance and rollback plan, set the Wrangler variable `ANEVUM_OWNER_TERMINAL_DUAL_AUTH=true` in the production config (the current PR intentionally pins it to false), pass CI, deploy, verify the same cases again, and check all writes/streams use the same gate. Roll back that config change if owner access unexpectedly fails, leaving broker execution service alone.
6. Never automatically set the feature flag merely because a Google login succeeded or because `ANEVUM_OWNER_MEMBER_ID` was configured.

### Known release limits

The personal member terminal is genuinely member-scoped but **not a broker connector or operating bot**. The owner ID and Access email have not been provisioned by this PR. Live company operator behavior remains dependent on the previously deployed Access gate until the owner explicitly completes the dual-auth cutover.

## Future personal brokerage design (separate release; no invented connectivity)

- Register a distinct Alpaca Connect OAuth application and whitelist exact callback URL(s). Alpaca's published guide uses the authorization-code flow, state nonce, specific `env=paper` or `env=live`, backend token exchange, and OAuth scopes. Only request the necessary read-only privileges initially; trading scope and live release require explicit additional consent and review.
- Once approved, create a tenant-owned durable model: signed-in Better Auth `user.id` → terminal/workspace ID → broker connection ID (encrypted server-only tokens, broker account identifier, token state, environment, revoke lifecycle) → tenant-scoped risk, configuration, positions, orders, events, and auditing. All SQL queries and every stream route must derive the tenant from the authenticated session and compare it with the broker grant. Never allow a body/query/path to select another tenant.
- Never put Alpaca API keys, OAuth tokens or the company's live trading credentials in D1 plaintext, HTML, member exports, JS bundles, Worker logs or browser storage. Use suitable encryption/key management and separate authorization for paper and live.
- Broker callbacks require CSRF state, expiration, one-time consumption, browser/session binding, exact origin, and validation of the returned broker account. Disconnect/revoke must remove member execution authority immediately. No cross-account fallback to company Alpaca credentials.
- A shared RHEN codebase and potentially shared infrastructure can be cost efficient, but independent per-member schedules, bot state, safeguards, telemetry, quotas, and order ownership are mandatory. No global live bot session should service multiple accounts without explicit task/tenant isolation.
- Invite-only paper testing comes before any customer live order capability. Alpaca's [Connect API terms](https://docs.alpaca.markets/us/docs/about-connect-api) require app registration and Alpaca approval for other users' live trading; commercial use must be disclosed and approved. The [OAuth2 Trading API guide](https://docs.alpaca.markets/us/docs/using-oauth2-and-trading-api) details paper/live authorization and token exchange.

## Acceptance

- Confirm canonical CI member-boundary, production-launch, navigation, member draft, UI and build tests pass on the PR branch.
- Confirm mobile/desktop real-browser UI QA and two **actual** authenticated users after deployment to isolated staging. Source/fixture tests do not replace browser and session checks.
- Confirm company RHEN read/write/websocket API only ever accepts separately verified owner identity after strict cutover; both member sessions and a cached owner Access JWT never cross an account boundary.
- Confirm original Railway RHEN runtime and production broker configuration are unchanged.

**Do not merge a separate live member trading enablement as part of this change.**

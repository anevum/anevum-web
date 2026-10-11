# ANEVUM Web / V5 / RHEN Separation Plan

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION`
**Date:** 2026-10-11
**Classification:** Controlled migration; current public production route must stay intact until acceptance.
**Owner direction:** `anevum.com` becomes the new creator community; the original V5 system becomes a distinct, owner-restricted workshop at `backstage.anevum.com`.

## Verified before modifications

- GitHub repositories `anevum/anevum-web` and `anevum/rhen` exist and are both **public**. A new hostname does not hide their source.
- Original production route `anevum.com/*` is bound to Cloudflare Worker `anevum-web-nextgen`.
- V5 Worker configuration uses member D1 database `anevum-members`; separate V5 beta and preview D1 databases exist.
- Original path-specific Cloudflare Access apps are `anevum.com/studio*` and `anevum.com/command/rhen*`; the Worker enforces signed Access JWT audiences, email allowlists and owner-member binding.
- V5 also depends on hostname-sensitive member authentication, redirect/origin validation and Cloudflare Worker asset handling. It references a Railway trader upstream; this is not evidence that the upstream is healthy.
- Railway inventory shows named projects `ANEVUM Core`, `RHEN`, `RHEN Archive`, but returned no live service inventory in the selected environments. **Do not delete, rename, or re-route anything based on incomplete evidence.**

## Changes already applied

- Created Cloudflare Access app `ANEVUM Backstage` covering `backstage.anevum.com`, allowlisting the two owner accounts and hiding it from the launcher.
- Bound `backstage.anevum.com` as a Worker Custom Domain to existing `anevum-web-nextgen`.
- Uploaded separate Worker `anevum-community-preview` and bound `next.anevum.com` as its Worker Custom Domain.
- Created branch `build/anevum-creator-platform-20261011` without changing `main`.
- The original `anevum.com/*` route remains unchanged.
- **Important:** Domain bindings and Access policy are not proof that V5 auth, Command, Studio, email flows, and cookies work on the new hostname. These remain unverified until authenticated browser acceptance.

## Intended architecture

| Layer | Host | Source | Data | Access |
|---|---|---|---|---|
| New creator platform preview | `next.anevum.com` | dedicated Worker, temporary isolated V5 repo branch | none initially, dedicated community D1 later | public preview, noindex |
| Creator platform production | `anevum.com` | **new repo `anevum/creator-platform` (pending creation)** | dedicated community D1 and storage | visitor / member / creator / moderator |
| Legacy V5 workspace | `backstage.anevum.com` | `anevum/anevum-web` | existing V5 production D1, preserved | staff via Access + app RBAC |
| RHEN trading and research | no public end-user hostname required | `anevum/rhen` | existing broker and research stores | service-level auth, operator only |

Public creator project pages may link to RHEN's sanitized source/research records, not to private account, order, or strategy data. The creator platform must not call trader execution endpoints.

## Acceptance stages and rollback

### Stage A — Baseline (partially done)

- [x] Inventory domain, Workers, routes, current repos and Railway projects.
- [x] Provision `backstage` hostname and owner-only Access app.
- [x] Provision separate public-site preview Worker and `next` hostname.
- [x] Preserve original production route, account secrets, trading gates and all data.
- [ ] Browser verify HTTPS and Access challenge for both allowed and denied identities.
- [ ] Record actual Cloudflare deployed version, DNS/cert health, V5 main commit and baseline availability.

### Stage B — Backstage compatibility (NOT DONE)

- [ ] Audit all absolute links, Canonical/SEO headers, OpenGraph, robots and redirects. Backstage gets `noindex`.
- [ ] Verify Better Auth trusted origins, CSRF, cookies (host-only), oauth callback hostnames, email verification/forgot-password URLs and session scopes.
- [ ] Verify owner-member binding, Studio auth (separate from Command owner), Cloudflare Access JWT audiences and signed assertions at the **new** hostname. Existing app audiences are for old path apps; a new catch-all app has a **different audience**, so private endpoints must not be assumed functional.
- [ ] Preserve existing production D1, sessions and export/delete workflows. Run encrypted backup + restore rehearsal before any migration.
- [ ] Check callback URI allowlists across Google/GitHub/Alpaca review and Resend, Cloudflare Access team domain and connected apps.
- [ ] Confirm no cross-origin cookie leakage into `anevum.com`. Prefer host-scoped sessions. Re-accept multiaccount isolation and private account exports.
- [ ] Verify `backstage` route for member/Studio/Command and RHEN read-only access separately, including deny tests.
- [ ] Confirm monitoring, owner alerts and rollback are available.

### Stage C — Creator platform development (STARTED)

- [x] Seed custom landing page, responsive original visual direction, discovery mock, filters, search and local-only draft form.
- [ ] Move source to distinct new GitHub repository (connector has no create-repository action).
- [ ] Create separate community D1 with versioned migrations; no sharing V5's D1 or auth secrets.
- [ ] Implement creator auth, RBAC, profile and project publishing pipeline.
- [ ] Add moderation, reporting, security-reviewed external demos, abuse controls, accessibility acceptance.
- [ ] Test with actual independent member accounts and preserve valid user consent.

### Stage D — Owner-authorized public cutover (NOT AUTHORIZED BY THIS DOCUMENT)

- [ ] Full testing on `next.anevum.com`: sign-up, publishing, moderation, access-control, performance, mobile and backup/rollback.
- [ ] Final review of all `anevum.com` legacy URLs and 301/308 redirects or protected response behavior.
- [ ] Archive encrypted backup of the existing V5 data and verify integrity with an isolated restore.
- [ ] Capture exact old `anevum.com/*` Worker route -> `anevum-web-nextgen` as rollback target.
- [ ] Verify Backstage access with fresh and denied sessions.
- [ ] Explicit owner approval of the exact new preview commit and DNS/Worker route cutover.
- [ ] Change `anevum.com/*` routing to the new creator production Worker, not the development preview.
- [ ] Smoke-test both public and Backstage hosts with rollback on failures.
- [ ] Update canonical URLs, OAuth configuration, analytics, indexing policy, monitored status and external links.
- [ ] Remove old main-domain Access apps only after the new host is verified, without removing owner protection.

## Security and privacy rules

1. A non-public or unlisted URL is **not** a security boundary. Require authentication, scoped cookies, role checks and appropriate network restrictions.
2. Making a GitHub repository private is distinct from changing a URL. Repository visibility requires an explicit review of open-source license, automation permissions, current links and collaboration goals.
3. Private account data, Alpaca credentials, brokerage actions and RHEN live execution remain outside the creator platform.
4. Do not create a proxy from untrusted project URLs into V5/RHEN. Do not host arbitrary user-supplied executable code on the primary origin.
5. Public platform data must have its own backup, encryption, moderation logs and deletion/export lifecycle.
6. Rollback and alerting must be exercised, not merely documented.

## Operational ownership

- Current V5 code remains at `anevum/anevum-web` through controlled extraction.
- RHEN remains at `anevum/rhen`; no Railway service, variable, database, credential, or trading gate was changed for this initiative.
- The temporary `community-preview` Worker is intentionally deployed **outside** the legacy Worker and has no database or secrets bindings.
- The independent GitHub repo, permanent production Worker, and public-site database migrations are next implementation gates.

# ANEVUM Porchlight V003 - Adult host and organizer interface

Session: `ANEVUM.ANEVUM.BUILD.2026-10-18.001.PORCHLIGHT-VERIFIED-ONBOARDING-UI`
Parent: https://github.com/anevum/anevum-web/issues/489
Stack: V001 PR #494 -> V002 PR #500 -> V003 (this build)
Status: **DRAFT SOURCE ONLY. NO REAL IDENTITY PROVIDER, HOMES, PERSONAL INFORMATION, CLOUD RESOURCES, SIGNUP OR PUBLIC DEPLOYMENT.**

## Objective

Give the isolated V002 event-consent API a functional mobile-first frontend while tightening private-data clearing and the externally verified session contract. The live ANEVUM Creator V1 product and January 1, 2027 plan are unchanged.

## Delivered

- `index.html`, `styles.css`, `app.mjs`: compact high-definition responsive field station with public approved directory, general-area adult host application, private own-submission status/withdrawal, independent organizer queue, approval/rejection/removal and manager-only emergency pause.
- A nongeographic fictional SVG/CSS-style neighborhood decoration: **not GPS, actual GIS, live map, directions or street safety certification**. No remote resources, SDK, analytics or location requests.
- Connected only to the V002 `/v1/*` API contract; no client-selected role or identity. Dynamically displayed API values use `textContent` and not `innerHTML`.
- V002 `service.mjs` strengthened: actor must be attested by trusted adapter as cryptographically verified, email verified and adult eligible; new organizer-approved public blocks API and private session capability endpoint; withdrawn/rejected submissions scrub private addresses, precise coordinates and display fields; cache-control no-store retained.
- `test/preview-server.mjs`: loopback-only, test-environment-gated, random fixture cookie sessions for development. **Never deploy this test server or use it as a real auth provider.**
- 25 V002 regression tests + 8 new service tests + 4 UI structural tests. Separate synthetic Chromium DOM workflow against localhost fixture API bridge: anonymous, two hosts, reviewer, manager, approval, public projection, withdrawal/privacy scrub and event pause.

## Local verification

From repository root:

```bash
cd prototypes/porchlight-v002
node --experimental-sqlite --test test/service.test.mjs test/v003.test.mjs
cd ../porchlight-v003
node --test test/ui-contract.test.mjs
node --check app.mjs
node --check test/preview-server.mjs
```

The browser check requires Python Playwright and Chromium, with a localhost-only fixture server. It does NOT establish a hosted, network-authenticated, real-account E2E test and must not be advertised as such.

## Review-only API additions

`GET /v1/events/:slug/blocks` returns an organizer-approved list of generic block codes/labels, event availability and the current consent version. No private addresses. `GET /v1/session?event=:slug` requires a verified adult principal and returns only the event-scoped role plus submission availability. Roles come from server grants only, never a public member profile or browser header.

New client `displayMode` is **block-only**. Exact pin placement remains an API feature subject to the V002 separate opt-in and organizer authorization but has no V003 public UI; this is deliberate while map-provider/privacy approvals are pending.

## Source boundaries and unresolved releases

**Do not route or deploy to anevum.com** based on this draft. Default V002 Worker remains 503, `PORCHLIGHT_DATA_ENABLED` is off unless an approved isolated runtime is wired. There are no public household signups, no verified session adapter, no live organizer user, no real neighborhood pin, no registered city partnership and no event payment features. User age is not independently verified by an attestation checkbox.

Provider-side identity, abuse reporting, organizer credential lifecycle, independent two-account hosted acceptance, event deletion/retention, site SSL/CSRF checks, payment/legal/insurance and map-provider approval remain necessary. See `RELEASE-GATES-V003.md`.

## Other parallel Porchlight drafts

PR #493 contains a distinct early event-directory/organizer bearer-token workflow and proposed data cleanup. PR #495 contains a more advanced 3D synthetic-only visual study. They are valuable references but not accepted dependencies here. Avoid merging overlapping implementations or reusing the bearer-token model as long-term organizer identity. A deliberate integration review is required before promoting any Porchlight branch.

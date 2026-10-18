# ANEVUM Porchlight — isolated V001 pilot source

**Session:** `ANEVUM.ANEVUM.BUILD.2026-10-17.001.PORCHLIGHT-NEIGHBORHOOD-PILOT`

**Status:** source-only, not publicly deployed, zero member enrollments, no host pins, no claims of affiliation with St. Cloud, Osceola County, emergency services or government. Owner's parent product: [Safety concept #489](https://github.com/anevum/anevum-web/issues/489).

## User value
- Adult-operated, opt-in event listing for one neighborhood at a time; no fictional hosts.
- Public **list view** works without maps, GPS, child accounts or optional subscriptions.
- Schematic map only displays separately verified, opted-in **exact** public pins. Area-only hosts remain in the list, not on a guessed pin. Map is **not** a street basemap or safe-route guarantee.
- Host form requests adult/household authority, public vs area-only location disclosure, venue options, and explicit consent. Submissions stay private until organizer approval.
- Cryptographically random one-time removal receipt displayed at submission; only SHA-256 stored. Withdrawal clears address and contact immediately. Requests and private queues require no browser-side stored token.
- Independent organizer may create/activate/close an event and explicitly review hosts via protected API. A publication requires out-of-band authority confirmation, valid event, consent and location bounds. Critical changes and their audit events use transactional D1 batches and roll back together on error.
- Reports privately recorded. Event closure removes public pins. Daily cleanup purges all event/host/report records 7 days after end.

## Guardrails
No live child tracking, live attendance/presence, surveillance feeds, strangers' chats, unverified allegations, patrol or emergency dispatch; no claimed safety certification; show **call 911** for emergencies. No public route deemed safe. Florida/location laws, map licenses, organizer terms and permissions need review before live operation.

**Production is not authorized by this source PR.** Do not change anevum.com/* or any Creator V1 / RHEN Worker, D1, routes, staff identities or payments. Never repurpose the existing member database. All variables default OFF and the included Wrangler config uses a deliberately invalid placeholder separate D1 ID. Organizer and rate secrets must be provisioned through secure Cloudflare bindings and never committed.

## Local review and synthetic browser QA
The isolated Worker API can be tested without Cloudflare infrastructure by Node 22+:
```sh
node --test safety/porchlight/test/pilot.test.mjs
```
The checked-in CI workflow also exercises Chromium at 320px, 390px and 1440px and captures the organizer screen, using a localhost-only synthetic event:
```sh
node safety/porchlight/test/browser-capture.mjs --chrome /usr/bin/chromium --output evidence/porchlight-v001
```
The captured synthetic data are **not** enrollment, hosted testing or production acceptance. Review-only workflow: `.github/workflows/porchlight-v001-review.yml`.

Public UI entry: `public/index.html`. Private organizer UI entry: `public/organizer.html`, with a bearer token held in memory only and no localStorage. The isolated Worker checks every staff API request server-side.

**Area-only locations never appear as plotted map points.** Their public location label is derived by the server from the event's general neighborhood; an organizer cannot publish an arbitrary address label for an area-only host. Event emergency closure cannot be reopened by pressing activate.

The [Halloween 2026 operator and adult consent packet](docs/HALLOWEEN-2026-PILOT-OPERATIONS.md) documents participant outreach, privacy, local escalation, emergency closure, independent acceptance and the information-only fallback. It is a draft, not legal approval.

## Configuration before a separately authorized pilot
1. Create an isolated D1 database and replace the placeholder ID only in a private release configuration. Apply `migrations/0001.sql` **to that database alone**.
2. Set `PORCHLIGHT_RATE_KEY` (random 32+ character secret), `PORCHLIGHT_ADMIN_SHA256` (SHA-256 of a randomly generated organizer bearer token), and `PORCHLIGHT_ADMIN_ENABLED=true` privately. Never place the bearer token or its hash in public HTML or versioned source.
3. Serve the public directory at a separately isolated app route. Keep `PORCHLIGHT_PUBLIC_ENABLED=false` and `PORCHLIGHT_HOST_SUBMISSIONS_ENABLED=false` until two-adult acceptance, revocation test, report moderation and content review pass.
4. Create a **draft** event through the organizer API. Verify the event organizer and consent materials before activating. Coordinates are bounds, not geolocation collection.
5. Perform an unauthorized POST/cross-event denial test, a real consent/withdrawal test, anonymous read test, mobile Safari 320/390, keyboard/reduced-motion, backup/restore, and emergency-close rehearsal.
6. Deploy only with explicit host/pilot authorization and verified cost/terms. Keep the ability to shut down just Porchlight without restoring or deleting ANEVUM's member database.

## API paths
- `GET /api/v1/porchlight/health`
- `GET /api/v1/porchlight/events`: only active, unexpired public events (empty until enabled).
- `GET /api/v1/porchlight/events/{slug}/hosts`: only reviewed published hosts, private details omitted.
- `POST /api/v1/porchlight/events/{slug}/hosts`: adult household host application with consent and rate limiting; returns one-time removal code.
- `POST /api/v1/porchlight/submissions/{id}/revoke`: host code-based immediate removal, independent of public flag.
- `POST /api/v1/porchlight/events/{slug}/reports`: private listing report, subject to rate limits.
- `POST /_private/porchlight/events`: organizer-only event creation.
- `POST /_private/porchlight/events/{slug}/activate|close`: organizer event visibility.
- `GET /_private/porchlight/events/{slug}/queue`: organizer-only pending addresses and private reports.
- `POST /_private/porchlight/hosts/{id}/decision`: organizer-only host approval/rejection/withdrawal.

Organizer bearer token is sent only in the `Authorization` header via secured operator tooling; no token sent in a URL. Operator should verify actual residence/permission **outside** this platform. There is no automated homeowner verification claim.

## Known V001 limitations
- Host updates require fresh submission and withdrawal rather than an authenticated edit page.
- QR image generation, licensed street basemap/3D buildings, reliable network routing and external agencies integration are not part of V001.
- The private organizer console can mark reports resolved. Two-person independent organizer authorization and a reviewed staff identity system remain future work; the one-token pilot console is NOT staff SSO.
- Organizer credential is single purpose for this isolated pilot, not production-grade staff SSO or an ANEVUM Member role.
- Cloudflare billing/plan entitlement could not be independently verified by the connection. No new D1, Worker, route, subscription or paid map service is created by this PR; do not incur costs without founder review. Static info-only fallback is acceptable if the approval gate cannot pass by Oct 31.

## Acceptance target
A consenting adult host submits one listing, an organizer approves it after out-of-band verification, an anonymous visitor can see **only** opted-in public fields, and the host can withdraw immediately; event end hides all pins. These are functionality goals, not verified real-world outcomes.

# ANEVUM Porchlight — synthetic neighborhood pilot, review V002

Session: ANEVUM.ANEVUM.BUILD.2026-10-17.001.PORCHLIGHT-NEIGHBORHOOD-PILOT
Program: https://github.com/anevum/anevum-web/issues/489
Status: Source-only isolated prototype. No public release, household enrollments, production API, real property coordinates, child accounts, city partnership or public domain.
Branch: build/porchlight-neighborhood-pilot-v002-20261017-001
Entry: experiments/porchlight/index.html. Not wired into the Creator V1 production build.

## Purpose and scope

A cinematic, navigable, illustrative 3D neighborhood for testing the first Porchlight user journey before real-household data:
- Camera pan via drag (including touch), pinch/wheel zoom, on-screen zoom and yaw buttons, keyboard movement and reduced-motion behavior.
- Procedurally rendered 3D house roofs/walls, roads, trees, synthetic opt-in markers and public-directory list. This is NOT a surveyed geospatial twin, real map, navigation/routing engine or representation of any St. Cloud residence.
- Official City of St. Cloud Trunk or Treat informational listing for October 31, 2026, 5–7 PM, Centennial Park, 1214 10th Street; no affiliation. https://www.stcloudfl.gov/Calendar.aspx?EID=5614
- Separate official City of St. Cloud versus unincorporated Osceola County waste-service links, no invented collection dates.
- Adult-host participation SIMULATOR (stage mock request → simulate organizer approval → withdraw consent), no server submissions, persistence, APIs, cookies, analytics or real addresses.
- Synthetic public listing allowlist and event expiry Oct 31 at 7 PM EDT (2026-10-31T23:00:00Z), including on an already-open page.

## Local review

Requires browser with ES modules and Canvas 2D. From repository root:

    cd experiments/porchlight
    python3 -m http.server 8765

Open http://localhost:8765/ from the same machine. A local static server is required due to module imports. No npm/framework dependencies, external map tiles or accounts.

Source/policy tests from repository root:

    node --test experiments/porchlight/model.test.mjs experiments/porchlight/static.test.mjs
    node --check experiments/porchlight/app.js
    node --check experiments/porchlight/model.mjs

Sample homes are fictional. The geographic environment is NOT the street map of downtown St. Cloud.

## Safety invariants

- No child accounts, child route, bus stop, real-time GPS, livestream, camera or property-occupancy information.
- No real house pin without affirmative adult/authorized resident consent, separately moderated approval, withdrawal and timed expiry. The simulator demonstrates gates only; it is not server-side authorization.
- Never auto-convert this synthetic data to production household records.
- The publicHost() allowlist rejects private notes, names, child data and street addresses.
- Official links do not imply city sponsorship, endorsement, school-district integration or safety certification.
- Real home pin visibility and alias must be a separate affirmative adult consent choice.
- First real pilot must add server-validated adult identity, consent timestamps/version, organizer role policy, control-of-home confirmation, reporting/moderation, emergency takedown, audit log, retention, rate limits, deletion and export, with real independent user adversarial testing BEFORE collecting addresses.

## Deliberate non-goals

No real signups, backend persistence, GIS, actual 3D model assets, real-world navigation, city service API, bus location, camera surveillance, 911 dispatch, payment system, SMS, GPS collection, third-party analytics, Creator V1 identity reuse or Cloudflare production changes. This is a synthetic 3D technical/UX demo.

## Required manual and device acceptance

1. Open on iPhone Safari and Android Chrome; verify 320, 390, 768 and 1440 CSS pixel widths, map movement, marker selection and page scroll outside the map.
2. Test VoiceOver/TalkBack, visible focus, list view, contrast, low bandwidth, no GPS, reduced motion and keyboard navigation.
3. Test mock pending/approval/withdrawal, hidden/unconsented houses and expiry including a page kept open past event end. Confirm no private field leakage.
4. Check official event URL and separate city/county links from live browser.
5. Only after these tests consider a protected preview origin and genuine opt-in participants.
6. Do not silently deploy, merge, migrate D1 or modify production.

## Future production architecture (not implemented)

Isolated Porchlight Worker/API and data namespace; adult-only identity and household control verification; community/event/host-submission/moderation/audit tables; public data allowlist only after approval and explicit consent; organizer roles isolated from public member roles; single-use revocation; event expiry; map provider terms/attribution and cost cap; no public household registry.

## Evidence classification

- Source-coded: canvas navigation, fictional directory, local-only mock approval/withdrawal and unit/static source tests.
- Unverified: browser runtime hosted URL, physical-device user acceptance, real location/map performance, real service integration.
- Not built: authentic household verification, authenticated server backend, real GIS/3D map, production release.

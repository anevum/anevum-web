# ANEVUM Family Safety — Dimensional Map Foundation

**Session:** `ANEVUM.ANEVUM.BUILD.2026-10-17.001.FAMILY-SAFETY-3D-MAP`
**Date:** 2026-10-17
**Status:** prototype under review, no real multi-user tracking, no public deployment.
**Product:** ANEVUM family / neighborhood safety vertical; working name `Family Field` (not a locked brand).
**Repository:** `anevum/anevum-web`; do not replace the creator platform or revive legacy V5.
**Demo source:** `prototypes/family-safety-3d-map/index.html` (isolation boundary)

## Product promise

Offer families a dimensional, interactive view of their world, where **approved family members can choose to share their locations within a private circle** and neighbors can collaboratively organize community activities and verified places without exposing children's whereabouts.

The map is the interface for real decisions, not an excuse to continuously watch other households. Distinguish (1) personal local view, (2) protected private family circle, and (3) deliberately non-identifying neighborhood activity.

Use cases for the initial St. Cloud, Florida pilot:
- Parent opens a 3D map of the neighborhood and sees their *own* device position after granting permission.
- A guardian sees a consenting family member's last-known position, clear accuracy and freshness; if old, visibly mark **stale/unavailable**, not missing or endangered.
- Family chooses a route, meeting place or temporary event check-in; no public tracking.
- Neighborhood coordinator can publish a voluntarily participating trick-or-treat stop or event area, without publishing children or household identities.
- Moderator handles a safety report under an evidence-based policy. No automatic public accusations, exact minor positions, or vigilante dispatch.

## Experience

### Core 3D interaction

Interactive map: pan, rotate, pitch, zoom, recenter, user-presence marker, 2D/3D perspective, 3D building extrusions and layer toggles. Aim for crisp, well-styled GPU vector rendering, responsive gestures, and restrained Continuance Institute styling. A 3D building extrusion is **not** photorealistic aerial imagery or a fully reconstructed 3D digital twin.

Future optional imagery may include licensed aerial/satellite and photogrammetry tiles only after coverage, licensing, budget and performance checks. Never claim every building is surveyed, real-time, or navigationally complete.

Layer categories:
1. **ME**: self-position only with explicit device permission.
2. **CIRCLE**: identities of mutually approved private connections, each with explicit active session, last update, accuracy, and accessible sharing controls.
3. **PLACES**: moderated community resources, event venues and volunteer participating houses with their chosen listing granularity.
4. **ACTIVITY**: confirmed public events, route closures, hazardous-crossing notices and moderated non-personal reports; event status and expiration required.
5. **ROUTES**: walking/biking/driving routes computed against licensed and validated road/path networks; no claimed safe route without evidence.
6. **ZONES**: guardian-created private geofences for check-in reminders with opt-in consent; no default public geofence feed.

Map controls must work on narrow iPhones, large displays, keyboard and pointer input, plus reduced motion.

### Family presence and accuracy

The location UI must display: location-sharing **on/off** status, who can view it, GPS accuracy estimate, last update time, last known vs live status, sharing expiry, and an immediate **Stop sharing** control. Use "location unavailable" rather than "person missing" if the GPS feed stops. Never imply that location establishes someone's safety.

Sharing modes planned: off by default; one-time check-in; time-limited live share; circle-specific share. A linked account or parent role alone does not imply consent or indefinite access. Child accounts require verified parental/guardian authorization; custody and abuse-risk cases need careful access and revocation rules.

No precise public "find everyone" map. "Everyone" means only members of the specific household/group with authorization, not any resident, child or neighbor.

### Privacy/security boundaries

- Treat exact lat/lng, private home, movement history and school destinations as **high sensitivity**.
- Prototype does **not** create family accounts, access tokens or location endpoints and must not persist or upload GPS coordinates to ANEVUM.
- Third-party mapping services receive the viewed map area via their tile requests; centering on the user's device may reveal the surrounding area to the tile provider, even if GPS coordinates are not sent as a dedicated API field. Disclose this and evaluate self-hosted tiles for sensitive users.
- On consent, browser can obtain device GPS in foreground only. Automatically stop the demo watch when hidden/page closed. A web PWA must **not** promise reliable always-on background GPS. Native iOS/Android with platform permissions is a later, separate path.
- Production server authorization is enforced on **every read, stream subscription, write, geofence evaluation and historical export**. A user knowing a circle ID must not provide access.
- Use single-use expiring invitations, verifiable family membership, adult account security, revocation, rate limits, anomaly monitoring, audit trails for accessing others' locations, and separation from public creator profile identities.
- Do not send private coordinates to analytics, logs, public feeds, moderation tickets, advertising or LLM context.
- Minimize retention; design a short-lived latest-position cache and explicit data deletion before enabling tracking. Continuous history is off by default.
- An exact home/location may be shown only when explicitly chosen by that house's owner and only to authorized audiences.
- Consider U.S. COPPA and other applicable laws for under-13 users, parental consent, household safety, record handling and deletion; obtain legal/privacy review before production.
- Distinguish non-emergency community features from 911 and trained emergency services. This product does not claim to dispatch police or guarantee safety.

## Implementation topology

Current repository uses React + TypeScript + Vite and Cloudflare Workers/D1 for Creator V1; do not silently couple creator profiles to family location records.

**Frontend:** MapLibre GL JS; 3D fill extrusions using building vector tiles, GPS via browser `navigator.geolocation.watchPosition` when foreground and consented. Map style/tile vendor must be configurable. Optional DEM relief comes from Amazon-hosted Mapzen Terrarium tiles and its coverage/accuracy must be evaluated independently; low-relief Florida terrain may appear nearly flat. The isolated HTML source proves the interaction without new production routes or secrets.

**Identity:** separate opt-in family-circle membership from the public creator/social identity; verified guardian roles and single-purpose invitations with expiration.

**Location ingress:** new authenticated Cloudflare Worker endpoint with CSRF protection where cookies used, signed authorization, validation of accuracy/timestamp/range and per-device/rate caps. Reject spoofed or implausible data as unverified, do not silently assert accuracy.

**Realtime:** circle-scoped Cloudflare Durable Object and authorized WebSocket/SSE fan-out (evaluate billing/latency), with expiry and revocation revalidation. A public broadcast channel is prohibited.

**Storage:** D1 for circle membership, permissions, policy, event locations (no precise member GPS); ephemeral recent-position storage with short TTL for consented sharing. R2 only for eligible moderated event media with separate consent. No location-history table in MVP.

**Routing:** integrate a road-network engine (e.g. self-hosted Valhalla or licensed directions provider) only after walking directions, crossing restrictions and safety notices are validated. MapLibre supplies display interaction, **not** route computation or guaranteed street-level photography.

**Native follow-on:** evaluate location updates with iOS Core Location / Android background location using official permission descriptions, battery testing, and app-store review. PWA stays focused on foreground check-ins and event participation. No Apple Developer subscription or live native app is assumed.

## Minimal data concepts (future, not created)

`circle(id, owner_id, name, created_at)`; `circle_membership(circle_id, subject_id, role, state)`; `share_grant(grant_id, source_id, viewer_circle_id, expires_at, revoked_at, precision)`; `location_presence(source_id, observed_at, lat, lng, accuracy_m, expires_at)` [ephemeral only]; `community_place(id, public_location_precision, owner_verified, moderation_state)`; `event(id, bounds, begins_at, ends_at, moderation_state)`; `location_access_audit(actor, target, action, timestamp, result)`.

A policy engine must guard each presence request using **subject, intended viewer, circle membership, revocation, sharing session, account security and guardian policy**. Never expose raw presence in public catalogue or member profile APIs.

## Release sequence

### R0 — Isolated 3D map interaction (this branch)
- Standalone 3D HTML prototype, no production routing.
- City-center starting point, not any family's residence.
- 3D building extrusions, optional global DEM elevation/terrain relief (AWS Terrarium), pan/pitch/rotate/zoom, map tabs, demonstration waypoints.
- Manual, foreground-only on-device GPS after explicit permission; browser state only.
- No other peoples' positions, no real location server, no uploads.

### R1 — Family circle privacy foundation
- Threat model and abuse cases; verified identities; private invite and revocation.
- Parent-controlled family circle, child protection review, explicit permission scopes.
- Self check-in and low-precision optional household coordination.
- Integration and negative-authorization tests; verified deletion.

### R2 — Opt-in, ephemeral family location
- Authorized time-limited location sharing, secure realtime transport, freshness and accuracy indicators.
- Circles isolated; stale-position behavior; real device and battery tests.
- End-to-end cross-account penetration test and abuse report path.

### R3 — Neighborhood pilot
- Voluntary homes/events, guardian-friendly Halloween walking routes, safe meeting places, moderation and verified crosswalk information.
- No public child position, no inferred household occupancy, no open neighborhood member roster.
- 5–20 consenting pilot households only after privacy + trust acceptance.

### R4 — Advanced navigation
- Turn-by-turn routing, geofences and check-ins, audited real 3D terrain and licensed photorealistic imagery (coverage/provider dependent), optional native background tracking.

## Acceptance / verification

Prototype acceptance:
- Desktop/iPhone viewport: zoom, pan, tilt, 3D building toggle and reset all function.
- Location prompt occurs only after user taps the explicit action. Denial is handled.
- Stop sharing/hidden tab removes marker and unregisters watch.
- Sample markers are labeled fictional and hidden by default; no real child/family location is fabricated.
- No URL query params, public tokens, worker endpoints or storage for location. No geolocation analytics.
- Browsing the map can still generate third-party tile requests; make this visible in data disclosures.
- Keyboard-accessible controls, reduced-motion support, contrast, GPU fallback warnings.
- Confirm on-device actual render and map tile coverage before publishing a public preview. This branch is not yet hardware-validated.

Release gating: security/privacy review, human adult circle acceptance with opt-in, cross-circle denial tests, app owner signoff. No real child location and no production deployment in R0.

## Reference material
- [MapLibre 3D building extrusion example](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/)
- [OpenFreeMap styles](https://openfreemap.org/quick_start/)
- [MDN geolocation permissions and watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
- [Apple background Core Location](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background)
- [FTC 2025 COPPA rule in Federal Register](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm)

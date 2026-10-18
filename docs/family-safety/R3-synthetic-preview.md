# ANEVUM Family Field — Synthetic 3D review

**Session:** ANEVUM.ANEVUM.BUILD.2026-10-18.001.SYNTHETIC-3D-FAMILY-PREVIEW  
**Status:** isolated source review; no real family service enabled.  
**Parent:** [Family Safety tracker #490](https://github.com/anevum/anevum-web/issues/490).  
**Upstream drafts:** R0 map #491 → R1 adult permissions #496 → R2 private presence #498.

## Purpose

Build an inspectable, cinematic map interface before wiring any real location sharing, so the visual and interaction requirements can be judged on a phone without exposing members, minors, homes or movement history.

The prototype has a synthetic 3D neighborhood scene with a tilted/rotatable map, mapped 3D building extrusions, optional raster elevation relief, animated and manually focused fictitious A/B devices, a time-limited fictional sharing session, mock signal loss, stale/unavailable semantics, hypothetical route strokes, and sample community waypoints.

**Every device, route, location, name, simulated consent and timer is illustrative.** In particular, a route stroke is not a routing engine, a safe road recommendation, a verified crossing, police report or an emergency service.

## Deliverable paths

- \`prototypes/family-safety-synthetic-preview/public/index.html\` — responsive one-screen dimensional family map UI.
- \`public/styles.css\` — cinematic Continuance styling, mobile controls and reduced-motion support.
- \`public/synthetic-engine.mjs\` — pure deterministic local simulation with invented map coordinates, sharing expiry, offline states and revocation.
- \`public/app.mjs\` — real MapLibre map interactions and overlays, rendering only invented markers from the local simulation.
- \`worker.mjs\` — read-only assets Worker enforcing **Cloudflare Access \`ctx.access\` identity + exact audience** before returning any page.
- \`wrangler.jsonc\` — dedicated, isolated workers.dev Worker. \`assets.run_worker_first=true\` is REQUIRED; a static-assets bypass of authentication is prohibited.
- \`test.mjs\` — mock Worker requests, state-machine tests, no-GPS/no-storage/no-family-API static checks.
- \`.github/workflows/family-safety-synthetic-preview.yml\` — automated source tests + headless Chrome desktop/phone screenshots. Screenshots are not real mobile hardware verification.

### Security properties

| Boundary | In review build |
| --- | --- |
| Actual GPS | Disallowed; no \`navigator.geolocation\` or browser permission prompt. Served with \`Permissions-Policy: geolocation=()\`. |
| Actual family IDs, personal data, child positions | None used; invented A/B identity and city-area coordinates only. |
| Cloudflare D1 / Durable Objects / Workers RPC | **No bindings**, no accounts, no database reads/writes. |
| Network endpoints | Browser requests pinned MapLibre CDN, map tiles, optional terrain tiles and fonts only. No ANEVUM account/location APIs. |
| Site exposure | Cloudflare Access must authenticate each asset request; Worker fails closed if no Access audience or identity is present. |
| Mutations | No POST/PUT/PATCH/DELETE routes. HEAD and GET only, allowlisted paths. |
| Maps | OpenFreeMap vector tiles with imperfect OSM-based extrusions; optional Amazon-hosted Mapzen Terrarium elevation, which is subtle in Florida. No satellite photogrammetry. |
| Browser state | No cookies written by application, LocalStorage, SessionStorage, IndexedDB or location history. Cloudflare Access may set its own authentication cookies. |
| Expires/revoke | Simulated local state. Does NOT touch R1/R2 real policy or count as proof of backend revocation. |
| Cache | \`Cache-Control: no-store\`, \`X-Robots-Tag: noindex\`, CSP, frame protection and explicit same-origin asset gate. |

Third-party map/script/elevation/font providers can see client IP and requested resources, including the viewed general map region. The demo does not collect precise device location, but that does not make tile rendering anonymous. Cloudflare Access receives the reviewer's authentication data; none of it is exposed by the preview Worker response.

## Review URL and deployment gate

**Do not infer that a URL is live from the repository alone.** The intended isolated Worker name is \`anevum-family-field-synthetic-review-20261018\` on the account's workers.dev subdomain. No production routes or anevum.com DNS changes.

The initial Wrangler config intentionally leaves \`FS_SYNTH_REVIEW_AUD\` empty, making every asset return 403. Before rollout:

1. Create a dedicated Cloudflare Access self-hosted app **only for this new Worker**. Restrict to the designated owner-reviewer email(s); no everyone/bypass policy.
2. Obtain the exact Access application's JWT audience and configure \`FS_SYNTH_REVIEW_AUD\` in the isolated Worker.
3. Verify \`assets.run_worker_first=true\` and that every static URL is blocked without \`ctx.access\`; use a separate/incognito browser.
4. Deploy isolated Worker with **no private bindings**, no real GPS env flag, no database and no public creator/Member routes.
5. Confirm every index/style/module request succeeds only for approved Access identity and exact audience; \`/__review\` must report GPS=false, privateDatabase=false, familyAccounts=false.
6. Smoke-test simulated 3D animation, zoom/rotate/terrain toggles, scenario clock, pause, signal loss, A/B revocation and reset; no Network tab POST to any ANEVUM endpoint.
7. Verify rendering, gesture targets and JS console on physical mobile Safari and Android Chrome before claiming real device acceptance.

Do not enable the R2 private presence Worker on the synthetic review Worker, attach public sign-up, or invite real families as a substitute for a reviewed privacy plan. Public Creator V1 deployment must remain unchanged.

## Test acceptance

- Identity absent, wrong Access audience, or failed \`getIdentity\` → 403 for **every** asset.
- Accepted Access reviewer and exact audience → static allowlisted GET/HEAD, synthetic read-only metadata; no API routes.
- A/B sample markers only appear after *manual* start; no page-load movement or GPS prompt.
- Site labels unambiguously say \`SYNTHETIC\`, \`FICTIONAL\`, or \`NOT SAFETY-VERIFIED\`.
- Stale mock update becomes unavailable, revoked fake device marker is hidden, and restart is explicitly a new fictional simulation.
- Headless Chrome screens are useful as layout evidence only. They are not a security review or real iOS QA.
- No analytics, GPS coordinates or member identities are shipped to the repository, browser storage or ANEVUM production systems.

## Next prioritized milestones

First finish the protected synthetic preview and visual acceptance. Next produce a real adult-only consent UX and isolated server provisioning review, then a tiny two-adult live staging test **only with explicit informed permission** and cross-circle/stale-cache testing. Child profiles, background location and neighborhood emergency features remain blocked until privacy/legal and abuse-resistance controls are approved.

# ANEVUM V078 — live release gate

Session: `ANEVUM.WEB.RELEASE.2026-10-18.002.PREMIUM-PLAYER-CARD-CUTOVER-GATE`  
Owner-approved intent: deploy V078 premium player-card UX to anevum.com, 2026-10-18.  
Status: **STOP / not deployed**; user authorization exists, but live source and routing are not reconciled.

## Validation completed

- V078 approved screenshot-inspired UI is ready: `design/player-card-premium-v078-20261018` at `5132c7e5af379ccb46bbd48373d3669cc914cee4`.
- Both V078 CI workflows on that exact SHA passed: `39162230342` (React browser, earned/privacy, TypeScript, 3D inspection) and `39162256479` (Creator V1 Verify).
- Prior V077 earned-card frontend/API changes are in parent PR #517. V078 depends on V077 and is still draft PR #519.

## Current production topology confirmed via authenticated Cloudflare reads

1. Account `2f7ee83107240152097efd956a4e8335`; zone `8abe27259b5436af5966d3b40d9a3760`.
2. Production application Worker `anevum-apex-prelaunch-gateway` is on 100% active version `a5277bda-9389-4d28-8de5-25f67afbe04a` (version #25), deployed 2026-10-18 20:08:20 UTC. Previous recovery is #24 `8bda78cc-b3e3-4de0-91de-d10d5d2656fc`. Preserve both as recovery references.
3. The broad `anevum.com/*` route is **not** bound directly to the apex Worker. It is `anevum-native-frame-policy-v001`, deployed around 20:27 UTC, with `UPSTREAM` service bound to the apex Worker. Its source modifies CSP `frame-src` for HTML while forwarding everything else.
4. `anevum.com/assets/index-*` is `anevum-native-project-player-v005`, service-bound upstream to apex, while `/play/*`, `/upload*`, `/staff*`, and multiple API routes are specialized Workers. Any broad route replacement or entire upstream build replacement risks those live integrations.
5. Production `anevum-apex-prelaunch-gateway` has 24 bindings (two D1 DBs, static assets, Better Auth/Resend secrets, feature flags). No secrets were displayed, copied, changed or exposed.
6. The site root presently redirects to `/discover`; Cloudflare browser rendering of `/discover` showed a rendered website. This routing was part of earlier emergency homepage blank-screen mitigation `ANEVUM.OPS.INCIDENT.2026-10-18.001`; there is not yet evidence that replacing it with V078's old home component would be safe.

## Critical discrepancy

V078 was implemented on V077, which was itself branched from the V076 original Evolution-media repair source. **The current live apex version #25 and the latest frame/player/uploader overlays arrived after that parent snapshot.** A direct `wrangler deploy --keep-vars` from V078 could overwrite its active frontend bundle and Worker code with an older source tree, regress homepage recovery, invalidate asset hashes, and/or harm community, uploader, player, staff or session flows.

Do not deploy by merging into stale `main`, deploying legacy `V076` scripts with hard-coded expected versions, replacing routes, editing static assets directly, writing D1, or injecting improvised CSS/JS from an edge overlay.

## Exact next permitted operation

1. Locate and reconcile the source SHA/config/asset manifest that produced live apex version #25, including emergency home routing and current routed overlay interfaces.
2. Apply just the V077/V078 media route, identity, and inspector changes to **that** restored live source. Retain all current native app/player, upload, staff, homepage, and CSP overlay behaviors. Rebuild all canonical native Evolution assets without changing entitlement/access semantics.
3. Deploy to an isolated, privately tested candidate with identical required bindings and static asset hashes where feasible. Verify: homepage has no blank screen; `/discover` loads; member sign-in and media functions; private/hidden stats; earned-only SVG cards; working 3D zoom/rotation; `/play/*`, `/upload`, `/staff` and project frontend assets; iPhone-width views.
4. Preflight immediately before swap: exact live source and Worker version equality, existing 24 bindings and D1 IDs unchanged, full zone route map unchanged, reproducible bundle hashes, and prior Worker version retained.
5. Promote with one guarded transaction and smoke test. On any failure, reverse immediately to exact previous version and static asset state, not just Worker script.
6. Record the release SHA/version id, timings and live probes in a release note. Only then mark **deployed**.

**This release gate is a protection of existing public traffic, not a request for new creative approval.** The founder has already approved the new UX.

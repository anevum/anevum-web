# ANEVUM V078 — live release gate

Session: `ANEVUM.WEB.RELEASE.2026-10-18.002.PREMIUM-PLAYER-CARD-CUTOVER-GATE`  
Owner-approved intent: deploy V078 premium player-card UX to anevum.com, 2026-10-18.  
Status: **RESOLVED / deployed 2026-10-18T20:52 UTC** from the reconciled incident-based branch. The pre-release STOP and risks below remain archived as the required safety conditions that were subsequently satisfied. See `docs/ANEVUM.WEB.RELEASE.2026-10-18.003.PREMIUM-PLAYER-CARDS-LIVE.md` for the production acceptance, active Worker version and rollback.

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


## Production release completion — 2026-10-18 20:52 UTC

**Status: DEPLOYED / guarded rollback version retained.** The original STOP gate above was applicable before release reconciliation and is kept as historical preflight evidence, not as a current blocker.

- Reconciled production source `release/player-cards-v078-reconciled-20261018` combines the previously deployed null-creator homepage incident fix with the V077 private front-facing art and V078 premium player-card UX.
- Exact production release SHA: `993965085a72b7a42a705b3ea5f3e7453fdb72d4`. The subsequent document/workflow housekeeping commits are not new deployment builds.
- Production Worker version 26: `50d33296-cee0-4565-93c6-a81777f23c85` at 100% traffic.
- Previous 100% Worker version 25: `a5277bda-9389-4d28-8de5-25f67afbe04a` retained for rollback.
- GitHub Actions release run: https://github.com/anevum/anevum-web/actions/runs/39165180412 — **success**, including rebuild of all 152 native asset files across the 30 canonical levels, exact frontend bundle hash under active asset overlay, production Level 4 earned SVG, original 3D scene, authenticated/unauthenticated access checks, live browser-rendered member card, and preservation of every existing zone Worker route, canonical D1 binding, 24 apex bindings and protected secrets.
- The release did not change creator upload, native player, staff, or frame policy routes.
- The conceptual mockups remain art-direction references. The present deployed V077 level illustrations use detailed SVG, not the photorealistic painted example imagery. Any future artwork change is a separate release.

No further release replay is authorized or required for V078.

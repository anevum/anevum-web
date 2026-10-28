# ANEVUM.WEB.RELEASE.2026-10-27.001.V140-SEVERANCE

Source approved for public UI: `fb1f903333187caa3bd7665e93c013f28b9f3366` in PR #786.
Original V67 deployed code: `2ef20ff31b6f116189918f4a7edc5aa93e3f4fea`.
Exact production Worker: `anevum-apex-prelaunch-gateway`.
Pre-cutover deployment: `2c6b4ebf-cfc6-4ddf-aa58-e61a1c8eb6a7`.
Pre-cutover live V67 Worker version: `a195834f-a0ec-4a0b-be78-1c6e905961f7`, 100% traffic.
Retained historical V61 and V63 versions: `c53d8b9c-625b-459a-a8cc-67ebb50155fd` and `77c8a9a6-f1ee-44fb-87d6-3271b3115c37`.

This release preserves the exact V67 gateway JavaScript digest, 26 bindings, 45 Worker routes, controller, current authentication/private data/runtime, existing cached-asset paths and earned media. It adds the owner-approved SEVERANCE homepage, HD media, 96 scroll frames, V140 public interactive depth, fallback, and existing routes on a new CSS/JS frontend bundle. The original V136 source allowlist remains intentionally sealed.

The workflow is a separate isolated production source: only the reviewed V140 head and three release-only files are allowed. It builds using exact V67 public frontend feature flags and pre-reviewed media artifact #12785837975 on workflow run #40617882293. It copies only verified source media bytes, never downloads third-party content into production. Both new Worker versions are uploaded **inactive** with original V67 gateway/settings and shared static asset superset. This prevents old cached clients from requesting absent assets across traffic shifts.

Rollout procedure: (1) verify current exact-head CI, media source/screenshot evidence and V140-compatible release check; (2) merge #786 into existing product lane #763 with its expected head; (3) run a release-only branch from exact approved source; (4) verify new paired package and inactive Cloudflare upload receipts; (5) inspect live/provider settings, bindings, 45 routes and existing V67 deployment unchanged; (6) optionally deploy canary via Cloudflare deployments API after independent acceptance; (7) monitor real homepage, navigation, status, auth, Studio, original client assets, media, and 320/390 mobile; (8) promote 100% only if healthy and preserve V67 for rapid rollback.

STOP if any audit, worker script, role/privacy, asset hash, CI, or provider deployment invariant fails. Never bypass the historical sealed release gate. No D1/R2 changes, account writes, payments, public player servers or game launch. This handoff remains a plan until exact deployment and QA readback are recorded.

## Verified source merge and release trigger

PR #786 was merged into its existing unified development parent #763 by commit `23c4a30aa0f23cdd2ed45843031f90bdd8066d8d`, preserving original parents and the tested V140 head `fb1f903333187caa3bd7665e93c013f28b9f3366`. This review merge does not change the Cloudflare deployment or the GitHub default branch.

The release-only workflow is triggered by a commit with exact message `release(v140): upload verified candidate` on this dedicated release branch. It validates the exact reviewed source, approved artifacts, V67-compatible flags, responsive compiled browser, restored V67 static-client inventory, sealed gateway and Cloudflare provider readbacks. Two Worker versions may be uploaded at zero traffic only after checks pass. Activation requires independent inspection of exact inactive receipts and the unchanged V67 deployment.

## Release browser QA repair (preserves original security coverage)

The first isolated release workflow run [40619928361](https://github.com/anevum/anevum-web/actions/runs/40619928361) passed reviewed-source checks, media restoration, production-flagged compilation, and the scoped V140 browser. The extended historical full-browser suite passed canonical private Studio at 1440/390/320, Commons, creator directory, Boards and Open Signal publication boundaries, then stopped at the obsolete V136-only `.p136-empty-index` homepage assertion. The V140 homepage intentionally uses the new `.av137-stage-home` cinema, preserving underlying routes.

The original `creator-v1/test/parity-v136-full-browser.mjs` is unchanged. A release-only copied regression `creator-v1/test/v140-production-compat-browser.mjs` updates homepage/cinematic controls and classification to the actual V140 public route while retaining the established Studio, privacy, account, route/controller, published-project, media, accessibility and failure-path test coverage. Release CI now runs this complete alternate suite and also checks its JavaScript syntax. The source allowlist remains fail-closed and includes only this independently readable regression in addition to its initial three release-only paths.

Production remains V67 until new exact-head CI, packaging and Cloudflare inactive readbacks succeed.

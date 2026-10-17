# ANEVUM / Evolution V064 optical fallback release
Session: ANEVUM.WEB.PATCH.2026-10-17.012.OPTICAL-MINIATURE-POSTERS
Date: 2026-10-17

V064 is a deployed, strictly presentational refinement to the pre-existing V062 30-level native 3D miniature engine. It improves the static poster for each of 30 levels when a native specimen is out of view, bandwidth/GPU constrained or reduced-motion/user fallback requires a still.

**Unchanged:** V062 shared WebGL1 context, GLSL native scene geometry, member XP and Level 30 threshold (63,075 XP), author profiles and privacy, notifications, the D1 schema, Cloudflare bindings, routes and secret values.

Build sequence from this branch:
- `python design/evolution-v059/src/export_native.py` and `python design/evolution-v059/src/render_web.py` from `design/evolution-v059/`.
- `python design/evolution-v059/src/micro.py`, producing 180 alpha-correct images (six optical sizes, 30 levels).
- `python design/evolution-v059/src/build.py`, preserving original 152-gallery-asset structure.
- `python creator-v1/ops/install-evolution-v060.py`.
- `python creator-v1/ops/apply-evolution-micro-v064.py`.
- Build Creator V1, run V060/V061/V062 and native WebGL browser tests.

The V064 installer preflights all thirty inputs and the canonical catalog before writing any files, then asserts an exact change set of 30 pre-existing compact-128 PNGs with the remaining 122 gallery assets byte-identical. It records SHA256 hashes for reproducibility.

Local validation (working copies of the archived V059 baseline and V060 optical assets): 180/180 transparency and dimensions; all 30 optical posters SHA256 matched; installer changed exactly 30/152 assets and left 122 unchanged. GitHub exact-commit V064 CI provides independent rendering, TypeScript checks, native GPU and reduced-motion review.

**Production release (2026-10-17):** Cloudflare Worker `anevum-apex-prelaunch-gateway` was promoted through Workers Versions deployment API to **V064 `80c6f0d1-c35b-4524-b97d-7cffdd4063d5` at 100%**, deployment `bc643112-3ec6-41e3-83d7-47e405e32022`. Exact known-good rollback is **V062 `fda6e24a-73ab-4331-ac0e-32f7dba6b237`**. Provider preflight verified 23/23 binding identities, all four opaque secrets, both D1 IDs, script module, compatibility flags and routes identical to V062. The app renderer and auth/membership code were not changed. This release uses the 30 optical fallback images produced by the source renderer.

**CI evidence:** local 180/180 micro renders and 30/30 image preflight; [V064 source and GPU QA run 39064556720](https://github.com/anevum/anevum-web/actions/runs/39064556720) succeeded; [non-deploying candidate QA 39064740618](https://github.com/anevum/anevum-web/actions/runs/39064740618) succeeded. Read-only [live smoke run 39065316636](https://github.com/anevum/anevum-web/actions/runs/39065316636) passed public signup, level archive and **native WebGL browser 1440px/390px/reduced-motion** tests. Its initial strict 30-SHA comparison found 28 exact matches and differences in levels 13 and 28: independent rebuilt images differed from actual candidate images in approximately 2.8% and 2.3% of pixels, maximum 5/255 channels, mean absolute error 0.019516 and 0.024139/255 including alpha. **Alpha was byte-identical**, and cache bypass yielded identical live versions, excluding stale CDN artwork. Actual deployed image hashes captured in `qa-v064-live/live-asset-hashes.txt` are the authoritative production release contract; `docs/evolution-v064-sha256.txt` is pinned to these hashes for ongoing independent checks. No 3D behavior, identity, permissions, XP or data mutations were involved.

**Guard for future changes:** Never run direct `wrangler deploy --keep-vars` against this script-managed Worker: it previously dropped secret bindings. Upload a non-deployed version; independently verify all 23 bindings and same route/compatibility settings, keep a pinned rollback, then promote explicitly with Cloudflare Workers Versions API.

Physical iPhone Safari, thermal/frame stability in long scrolls, and VoiceOver remain separate device acceptance checks; desktop and simulated mobile Chromium are not substitutes.

# ANEVUM / Evolution V064 optical fallback release
Session: ANEVUM.WEB.PATCH.2026-10-17.012.OPTICAL-MINIATURE-POSTERS
Date: 2026-10-17

V064 is a strictly presentational refinement to V062, the currently live 30-level native 3D miniature engine. It improves the static poster for each of 30 levels when a native specimen is out of view, bandwidth/GPU constrained or reduced-motion/user fallback requires a still.

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

**Deployment guard:** Production Worker `anevum-apex-prelaunch-gateway` remains V062 `fda6e24a-73ab-4331-ac0e-32f7dba6b237` (last verified at 100%). Do not run direct `wrangler deploy --keep-vars` for this Worker: a prior release dropped four secrets and had to be rolled back. Before promoting V064, upload an **unrouted** new Worker Version, validate all 23 bindings, 4 opaque secrets, 2 D1 IDs, correct executable and expected Worker assets, verify no configuration drift, and promote only through an explicit Workers Versions deployment that preserves the old version for rollback.

Physical iPhone Safari, thermal/frame stability in long scrolls, and VoiceOver remain separate device acceptance checks. Do not claim deployment until the Cloudflare deployment API and public version checks confirm it.

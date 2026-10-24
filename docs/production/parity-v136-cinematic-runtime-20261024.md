# PARITY V136.016 — Optimized Shared Cinematic Scene and Isolated Runtime QA

Session: ANEVUM.WEB.BUILD.2026-10-24.006.SHARED-CINEMATIC-RUNTIME
Date: 2026-10-24
Repository: anevum/anevum-web
Branch: build/parity-v136-cinematic-runtime-20261024-016
Stack: #727 -> #728 -> #729 -> #730 -> #731 -> V136.016.
Status: DRAFT. Source implementation and test infrastructure. No production traffic or payment/publishing changes.

## The problem being solved

V136.015 exported an original detailed Blender Institute (676 meshes, 6.55 MB source GLB) alongside precise camera poses. The existing live Three.js Atrium v136-011 uses different geometry and camera coordinates, so claiming a seamless transition would be inaccurate. Shipping the raw GLB to every visitor would also increase draw calls and transfer by unacceptable amounts.

This increment builds optimized camera-compatible desktop/mobile variants and exercises them **inside the current ANEVUM persistent WebGL renderer**, only in a disposable opt-in Chromium browser environment. No extra canvas, graphics host, database/API or third-party media service.

## Implemented code

- `creator-v1/graphics/lod-cinematic-institute-v136.py`: Reload the unchanged, packed source .blend independently for desktop and mobile. Preserve original world coordinates; combine 3D objects into material-specific draw-call batches (capped to avoid the 1 MiB Meshopt accessors per-worker). Remove nonessential mobile far-field and fine-grained detail while keeping major architectural silhouettes. Export two source GLBs and an unapproved LOD manifest. Original Blender editable master remains untouched.
- `creator-v1/graphics/optimize-cinematic-runtime-v136.mjs`: Use existing pinned glTF-Transform and Meshopt encoder, no added packages. Verify original Blender camera revision, source GLB hashes, frame sample count, triangle topology and draw limits. Encode desktop/mobile GLBs with `EXT_meshopt_compression`, record SHA256, encoded bytes, original scene revision, original camera samples and landmark data in `UNREVIEWED_QA_ONLY` manifest. Staging transfer/draw/triangle budget checks fail closed.
- `creator-v1/web/src/parity/CinematicStageGeometryV136.ts`: Strict same-origin GLB URL and source revision/hash validation, bounded triangles/draws/bytes, normalized camera sample validation, no arbitrary URLs, verified WebCrypto SHA256 of downloaded static GLB. Stage only; explicit no production approval or claimed equivalence to legacy Atrium.
- `creator-v1/web/src/parity/InstituteRendererV136.ts`: Existing single Three.js renderer conditionally loads the stage GLB through the same GLTFLoader and CSP-safe Meshopt reference worker. Only when `VITE_PARITY_V136_SHARED_SCENE_QA=true` and hero route is active. All normal builds continue to load the previously proven eight v136-011 GLBs; the model falls back if candidate metadata, hash, conversion, fetch or scene parse fail. Stage camera positions, orientations, up vector and vertical FOV use the original Blender frame samples while the user scrolls through Arrival. Existing route camera applies elsewhere.
- `creator-v1/web/src/parity/CinematicArrivalV136.tsx`: Passes only bounded, temporary 0..1 hero scroll progress via a local decorative DOM data attribute in isolated QA builds; no new navigator, event stream, private accounts, URL mutation, analytics or session writes.
- `creator-v1/test/parity-v136-stage-geometry.test.mjs`: Candidate schema and security gates, bad paths, implausible mesh/camera values, wrong scene version, no accidental approval, no second canvas.
- `creator-v1/test/parity-v136-cinematic-stage-browser.mjs`: Real Chromium/WebGL2 tests on disposable build at 1440 and 390 CSS px: correct source GLB bytes, one renderer, bound GPU draw/triangle counts, scroll-driven Blender camera frames in actual Three.js pixels, usable semantic Discover navigation and no unexpected network calls. Browser software GPU is evidence of compilation, NOT physical Safari/Xbox performance.
- `.github/workflows/parity-v136-cinematic-production.yml`: After the authored source render and precise-camera verification, creates LOD meshes, compiles Meshopt, temporarily copies assets to a QA checkout, builds with three EXPLICIT QA-only environment flags, runs a disposable browser test and uploads screenshots and original/optimized models for review. Static outputs are CI artifacts, not repository binaries or public CDN assets. The main protected production workflow never sets `VITE_PARITY_V136_SHARED_SCENE_QA`.

## Budgets / security

- Desktop compressed GLB <=1.7 MB, <=175,000 triangles, <=36 primitive batches.
- Mobile compressed GLB <=900 KB, <=100,000 triangles, <=22 primitive batches.
- The existing Meshopt CSP-safe reference worker limits any single buffer decode to 1 MiB. LOD material batching limits source accessor size; actual browser decode verifies it.
- Candidate manifest must say `stageOnly:true`, `approvedForProduction:false`, `visualQAPassed:false`, `oldLiveAtriumEquivalent:false`. Matching numeric source landmarks is NOT a claim of fully matched pixels.
- No external asset URLs; GLB must have native glTF header, expected byte count, verified SHA256, original Blender camera samples and exact source version.
- Normal production compile with stage flag omitted/false retains original geometry and standard local poster fallback. Media sequence remains unapproved and native video CSP unchanged.
- No changes to user identity, private work, backend Worker, D1, R2, OAuth, publishing rules, supporter checkout, account permissions, Cloudflare WAF or traffic weights.

## Execution sequence

1. Source Blender master produces genuine original 960x540 CI preview (not final AAA native-resolution art), packed .blend and source GLB/camera/landmark metadata.
2. Blender LOD generator groups source meshes, preserves exact world coordinates and records how many architectural objects and materials were retained.
3. Meshopt compressor creates two QA static candidates and immutable hash records. Reject if resource budgets cannot be achieved, rather than silently shipping excessive meshes.
4. CI compile with `VITE_PARITY_V136_FULL=true VITE_PARITY_V136_CINEMATIC=true VITE_PARITY_V136_SHARED_SCENE_QA=true`, staging bytes only in disposable checkout. Old release build flag remains OFF. Run desktop/mobile real GPU browser test and retain screenshot evidence.
5. QA compare same-world final Blender camera frame against actual Three.js frame. Difference in lighting/materials, painterly matte, tone mapping, perspective and visibility must be recorded and resolved before declaring concept parity or pixel-perfect handoff.
6. Only after human art review, mobile real-device GPU acceptance, source/handoff geometric and visual checks, access/security review, and Cloudflare same-version asset verification should a new separately approved production manifest be considered. Native MP4/WebM playback requires separately reviewed CSP `media-src 'self'` still; this stage uses image+GLB only.

## Known limitations

This is an intentionally scoped staging pilot. Exact source geometry and source camera coordinates can be mathematically aligned while its runtime appearance still differs from Blender Cycles due to missing baked textures, environmental light, fog, renderer tone mapping, and the camera-attached prerendered background matte. Stage geometry is not yet creative-approved or GPU-soak-tested. A successful Chrome SwiftShader test alone cannot authorize a mobile/Xbox live rollout.

Release lineage stays stacked as draft PRs; never merge independently into a production branch or mark feature flags as active based only on synthetic CI results.

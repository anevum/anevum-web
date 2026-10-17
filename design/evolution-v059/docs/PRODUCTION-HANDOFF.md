# ANEVUM / Evolution Reconstruction / V059

Session: `ANEVUM.WEB.BUILD.2026-10-17.008.EVOLUTION-HYPERRES-ARTWORK`  
Development branch: `design/evolution-hyperres-v059-20261017-008`  
Status: complete 30-specimen technical reconstruction; unreleased artwork review candidate.

## What is delivered

All 30 levels were rebuilt individually as native 3D compositions. The V058 SVGs were not enlarged or filtered to create these specimens. Each scene contains named meshes, editable UVs, material assignments, motion identifiers, phase/speed parameters and an independent silhouette. The six chapters and every name/threshold are preserved.

The full-source archive includes 30 transparent 2048×2048 PNG masters, 90 WebP derivatives at 256/512/1024px, 120 compact PNGs at 32/64/128/256px, 30 glTF scenes with adjacent binary mesh buffers, 30 editable scene JSON files, and 30 SVG field overlays. The SVGs are supplementary vector fields, not flattened image wrappers or substitutes for the 3D objects.

Four material families provide native 4096px height, normal and roughness maps: mineral, membrane, aqueous and ceramic/metal. The image-generated obsidian albedo original is 1254px. Its applied quality-95 JPEG is retained alongside the original PNG. These dimensions are documented accurately; the original texture is not presented as native 4K.

Thirty actual 3-second 24fps animation MP4s, six chapter motion reels and an 18-second full-series reel are included. Each video renders the actual geometry and shared shaders in expressive mode, rather than applying motion to a still image. The live inspector uses the same animation system, with pointer rotation, keyboard-operable rotation/zoom controls, pause, expressive/quiescent modes, reduced-motion handling and static fallbacks.

## Demonstrations

Open `ANEVUM-V059-INTERACTIVE.html` for the self-contained offline review. It includes all thirty specimens, six chapter filters, search, member-profile/card examples, a large native dialog inspector and the ANEVUM mark-first recognition expansion. Profiles and notifications are explicitly local examples, without real member data or XP writes.

`ANEVUM-EVOLUTION-V059-WEB-REVIEW.zip` contains the lightweight static web build. Serve its `index.html` over HTTP(S). It requests one compressed 3D scene at a time and uses static derivatives in the gallery/profile cards. The standalone offline file is larger because it embeds the whole collection; it is intended for review and portability.

## Native editing and reproducibility

`src/geometry.py` is the authoritative procedural source. Each level is its own explicit composition in `Scene.build`; compact variants use a separate geometry pass. Import `artwork/native/level-NN.gltf` into a glTF-capable 3D editor, preserving adjacent `.bin` and relative texture paths. All meshes remain individually named and editable.

The native glTF 24-second pose loops provide portable rotation/scale/translation. Complete phenomenon-specific deformation and traveling emission are preserved in `src/material.vert`, `src/material.frag` and scene JSON. A general-purpose glTF player does not reproduce those custom shaders automatically. No `.blend` files, sculpt-history project files, fluid caches or path-traced production scenes are claimed.

The GitHub branch stores the procedural sources, applied albedo, registries, complete manifest, test harness and workflow. Generated assets are delivered in the archive and can be rebuilt. The original Vesper SVG and both GitHub progression registries are retained as references. `docs/ASSET-INVENTORY.json` records per-file sizes and SHA-256 hashes.

## Verification

`docs/ARTIFACT-QA.json` contains asset/geometry/alpha, dimensions, native animation, texture reference, offline dependency, progression and text-contrast checks. `docs/MOTION-RENDER-RESULTS.json` records all thirty measured renders and frame deltas. Browser acceptance evidence is stored separately with the exact tested GitHub commit and environment when available.

Headless render timing uses Mesa llvmpipe at 448px. This is useful diagnostic evidence, not proof of 60fps on native mobile hardware. Browser testing uses desktop Chromium and simulated 390/320px widths. Native iPhone Safari, VoiceOver/screen-reader operation and battery/GPU behavior require separate real-device acceptance.

## Outstanding limits and review decision

The collection is a complete, editable real-time reconstruction, but it should not be described as an approved final photoreal production standard. Several forms remain stylized and need an artistic review against the requested long-term visual bar. The early symmetry/field pieces, stellar granulation, particulate galactic silhouettes and final prestige composition deserve particular attention during that review.

Materials use GGX direct lighting, sampled textures, procedural fields and bloom. They do not implement physically simulated plasma, fluid oceans, true participating-media transport, subsurface scattering or physical refraction. Gas uses depth-bearing layered density cards. These are real-time approximations, not scientific simulations. Surface texture detail and native model editability do not by themselves imply cinematic path-traced realism.

No production website asset, authentication flow, member record, balance, achievement or XP system was changed. Exactly 30 permanent levels remain, across six chapters, using `75 × (L−1)²`; Level 30 remains 63,075 XP. No test XP was migrated. Public deployment requires the owner's review and approval of the finished visual collection and device acceptance.

# ANEVUM PARITY V136.017 — Flagship UI/UX Concept Convergence, First Implementation

Session: ANEVUM.WEB.BUILD.2026-10-24.007.CONCEPT-CONVERGENCE-FOUNDATION
Date: 2026-10-24
Repository: anevum/anevum-web
Branch: build/parity-v136-concept-convergence-20261024-017
Base: PR #732 V136.016 shared Blender-to-WebGL staging, stacked through #731/#730/#729/#728/#727.
Status: DRAFT SOURCE IN GITHUB. Visual review pending. NO production activation.

## Goal and visual disagreement

The flagship homepage and private Creator Studio currently have genuine functionality but present as conventional sections/panels in front of cinematic scenery. The governing PARITY V136 boards call for a composed, sculptural Institute Arrival and an integrated machined creative workstation. This pass upgrades *actual browser DOM/CSS/assets* without claiming that the fully painted AAA reference quality is already delivered.

## Implemented 017.000–002 foundation

- \`ContinuanceInstrumentV136017.tsx\` — original deterministic first-party SVG orbital engraving: hand-authored elliptical instrument axes, 48 ticks, canted optical rings, finite anchor glyphs, celestial core and ornament. Decorative, aria-hidden, no second WebGL canvas, network requests or controls; no fabricated analytics.
- \`ParityPortalV136.tsx\` — stage-oriented Arrival metadata, designed orbital component, stronger heading grouping, dimensional IREN casing and station-rail labeling; existing real Discover/Join/Studio/Community/IREN/search links remain unchanged. Verified catalogue and disclosure text remain source-derived; no new fabricated creator/project records.
- \`concept-convergence-v136017.css\` — **scoped new visual module** with dedicated v136.017 palette, layered alloy engravings, celestial stage treatment, etched borders, original light channels, hero/IREN integration, content cards, navigation instrument, redesigned Studio casing, command ribbon, source workstation controls and Monaco chrome. Dedicated responsive layouts at 1300/1050/820/520 widths, with reduced-motion and forced-colors fallback. New first-party CSS/SVG only, no remote fonts or unreviewed video.
- \`StudioSpatialWorkspaceV136.tsx\` — new real-route navigation instrument (Overview/Project Library/Builds), private project count derived from actual authenticated session-bound records, explicit no-approved-publishing claim; preserves actual canonical workspace and permission-based reviewer controls.
- \`ArtifactWorkbenchV136.tsx\` — structured source/validation/archive instrument bar and active file name; honest \`LOCAL · NOT EXECUTED\` status and existing Archive/Monaco capabilities, without fake terminal/build/run function. Historical data-test IDs stay stable.
- `FileGlyphV136017.tsx` — original local SVG symbols for HTML/CSS/JavaScript/JSON/Markdown/text. The real Monaco workbench explorer and tabs use these icons. Filenames remain ordinary accessible button labels and no external font or dependency was added.
- \`main.tsx\` — import the module after existing legacy/foundation visual styles **only** within \`VITE_PARITY_V136_FULL\`, so normal production build is unaffected when feature off.
- \`parity-v136-concept-convergence.test.mjs\` and updated compiled browser QA: test actual DOM, first-party decorative semantics, CSS scope, unchanged route/session constraints, two-line desktop headline, 665–895px hero density and real Studio/Monaco/archive behavior at desktop and mobile. Protected source file allowlist updated only for these files. The Chromium software-GPU screenshot viewport is captured at CSS pixel ratio 1 to avoid oversized CI framebuffer memory, with high-density device QA still outstanding.

## Remaining visual work (NOT delivered yet)

- Produce a true concept-matched native-resolution master scene with art-directed architectural detail; existing first-party poster and original Blender review GLB are **not** final artistic acceptance.
- Compare latest 1536×1024 and 1440px homepage browser screenshots side-by-side with locked reference; rectify silhouette, typography occupancy, anchoring, command rail and IREN. Scoring 4/5 in each major dimension is proposed but has not yet been measured.
- For Studio, expand the delivered source-file glyphs into a more complete original command and asset instrument family, and continue authoring tactile surface textures. Record actual edits/upload/playtests, preserve 24 files/128KiB/1MiB local source constraints. Do not claim server-side persistent IDE.
- Real browser QA is the next step. Passing generic CI does not verify pixels without reviewing artifacts, nor can software WebGL substitute for physical Xbox Edge/iPhone Safari acceptance.
- Benchmark LCP/CLS/INP under realistic network/mobile conditions before public rollout.

## Release / privacy boundaries

No backend, auth, private D1/R2, memberships, XP, checkout, payments, publishing or worker version modified. No console controller mapping changes. The V136.016 cinematic stage flag, native video flag and unapproved media remain disabled on production. The existing WebGL renderer and authored camera QA stack remain intact. No Cloudflare traffic changes; do not merge stacked branches out of order.

## Acceptance and follow-up

Run Node source test and existing full Chromium seven-size + private Studio source browser suite. Capture \`arrival-1536.png\`, \`arrival-390.png\`, \`artifact-workbench-1440.png\` and \`artifact-workbench-390.png\` from the exact commit. Verify no horizontal overflow, readable and clickable CTAs, mobile first screen, keyboard/controller and single IREN/Wayfinder/scene. Resolve visual discrepancy tickets before calling 017 final concept fidelity. Keep draft PR open until independent art/functional acceptance.

## V136.017.003 — Studio IDE source navigation (draft)

The first-party source workbench groups actual permitted local source paths into a deterministic folder-first tree. New source paths like `assets/notes.md` are represented as a real `assets` folder with a selectable file. It adds a matching original SVG folder engraving, collapse/expand controls with `aria-expanded`, and keyboard-focusable file navigation. No synthetic project entries or remote tree service exist.

Actual Monaco tabs, source content, 24-file/128 KiB/1 MiB limits, ZIP/archive integrity, privacy boundaries, private uploading and isolated playtesting are unchanged. The browser regression exercises real nested source creation, folder collapse/expand, genuine archive preparation and stale-archive invalidation.

This is a subsequent draft visual/interaction increment, not proof of final concept fidelity. Owner side-by-side visual approval, real 3D master acceptance, physical Safari/Xbox checks and performance gates remain open.

## V136.017.004 — real 1440px authoring layout defect and regression gate

The V136.017.002 **real Chromium 1440×960 source-editor screenshot** showed roughly a 55px-wide Monaco pane: the canonical Studio navigation, two-column native build upload shell, local file explorer and source inspector all claimed space concurrently. This violated the concept and made editing impractical despite green generic route tests.

The fix is scoped to the full-visual source workbench when it is actually open. The existing Studio member navigator is narrower but remains present; the native upload guide moves below the authoring panel without disappearing. The workbench uses its own **CSS container inline-size** to switch between three-pane, explorer/editor + lower inspector, and narrow stacked layouts independently from screen-wide breakpoints. Native upload form, privacy and canonical Studio source ownership remain unchanged.

Compiled Chromium regression now asserts minimum real editor width (desktop 440px, 390 phone 255px, 320 phone 190px) and below-editor guide placement at 1440px. An obsolete source-text unit assertion was repaired to target the actual new `node.path` explorer implementation. Physical-device and owner-reviewed art matching remain separate release gates.

## V136.017.005 — local Markdown versus playable ZIP

The exact-head Chromium test for V136.017.004 confirmed the nested Studio layout, then revealed a real browser-build incompatibility: creating `assets/notes.md` produced a ZIP rejected by the existing V003 native package parser. This is a legitimate upstream safety boundary, not a flaky timeout.

The authoring workbench now distinguishes `Prepare build archive` (canonical MIME-supported files only, any skipped local-only Markdown explicitly listed) from `Download complete source` (all authored files, including Markdown). The current player and server MIME whitelist remain unchanged. A source-archive regression test proves the complete backup retains the Markdown, and the playable ZIP passes the V101 compatibility inspector. The browser test still uses a real nested Markdown source item and must now see an actual playable candidate, never a synthetic report.

## V136.017.006 — explicit modeled-world inspection

The real 1536×1024 Chromium screenshot still presents an original cinematic poster while the persistent Three.js environment loads behind it. An accessible, optional **Inspect live 3D** control allows the visitor to see the existing rendered model without scrolling. It is disabled until the real WebGL model reports ready, signals loading/fallback truthfully, and restores the original poster on reset or GPU loss. Scroll navigation, IREN and other DOM controls are unchanged.

One small opacity transition serves pointer/keyboard interaction; reduced motion removes it and forced-colors omits the nonessential control. No second renderer, alternate camera, unapproved native video, automatic publication, new service or speculative performance claims are introduced. New pure utility and compiled browser assertions verify ready-only reveal, single canvas and return to cinematic. This is a prototype model inspection; high-fidelity concept-master visual approval remains pending.

## V136.017.007 — directly capture genuine WebGL architecture

The previously delivered browser PNGs are overwhelmingly *cinematic poster screenshots*. This correctly documents the functional homepage but cannot validate the 3D Atrium against the approved Continuance Institute reference. Compiled Chromium now collects, from **the same 1440px and 390px contexts**, `arrival-poster-review-*.png`, `arrival-real-webgl-review-*.png`, and `arrival-after-inspection-*.png` as separate artifacts. The test verifies a genuine active Three.js WebGL renderer, one persistent canvas, valid loaded geometry (real triangles/draw calls), disabled-poster overlay, visually distinct captured PNGs, unchanged real navigation and poster restoration.

The evidence is an engineering **visual inspection input**, not an automatic concept-parity score. The existing `.016` registered Blender/GLB remains QA-only; reference-quality live 3D lighting, silhouette, terrain and atmosphere need an explicit reviewer decision before any runtime substitution. No user data, external assets, second renderer or production flags are involved.

## V136.017.008 — original procedural planetary horizon (isolated renderer QA)

Added `InstituteHorizonV136017.ts`, a small, original, deterministic 3D gas-giant surface and atmospheric rim with two illuminated orbital rings. The module is **optional** and attaches to the existing Three.js scene/canvas under `VITE_PARITY_V136_HORIZON_QA=true` only. The environment is visible solely on the public Arrival hero and is skipped on save-data. It uses no downloaded textures, remote GPU services, member data, fictional user-activity counts or second WebGL context. Static geometry keeps sub-18k triangle desktop and sub-7k triangle mobile candidate budgets (4 draw calls), an owned dispose lifecycle and extremely slow orbital variation disabled under reduced motion/paused/hidden states.

The architecture candidate is **not** the reviewed Blender asset and does not claim to meet the governing reference. The isolated spatial CI build flag enables it for live-poster comparison captures, source asserts, a genuine renderer/triangle check and one-canvas proof. The release packaging script explicitly **rejects** this unreviewed visual flag and does not change public deployment flags. Art-direction acceptance requires reviewing the exact live scene at 1440/390 against the original concept before any production activation.

## V136.017.009 — transparent live-view stage, not a no-op toggle

After inspecting CSS layering, the original hero kept an opaque radial-gradient background from the visual-convergence stylesheet. Hiding the cinematic poster alone could not reveal the fixed Three.js canvas behind `.site-main`: the new inspection control would have toggled mode without showing architecture. The CSS now removes the hero's opaque paint **only while** the real ready-only inspection button is pressed; the original design shading, text, IREN, DOM links and poster return remain.

The actual Chromium 1440/390 inspection test now asserts that the composited hero background is fully transparent while the real GPU context is active. This fixes the root cause without moving the existing renderer, creating a new canvas, changing the resting cinematic art, or exposing the stage when the live model is not ready.

## V136.017.010 — first-party instanced citadel silhouette candidate (QA only)

After inspecting the actual 960×540 Blender source frame against the approved floating-Institute visual concept, the broad industrial decks and simple cylindrical skyline remain below art direction. Added a compact original `InstituteCitadelsV136017.ts`: multi-island platform strata, suspended geology, machined turret shafts, auric spire caps, illuminated architectural windows and orbital railing rings. These are real vertex meshes instantiated inside the existing V136.017 QA planetary world, not texture-paint replacements. Windows represent structural fixtures, never visitor activity.

Desktop produces three layered outposts and mobile two reduced-geometry outposts, all in six instanced draw batches with deterministic transforms and resource cleanup. An executable Three.js test verifies exact instance/triangle accounting, generated bounds, pause/reset motion and disposal. The parent horizon budget counts **InstancedMesh.count** rather than merely per-template triangles, with staged ceilings of 25k desktop and 10k mobile triangles / 10 draw calls. No additional WebGL contexts, production visual flags, external 3D assets or member data. Architectural fidelity is still awaiting authentic full-frame browser visual acceptance; this is a candidate detail pass, not the final Blender master.

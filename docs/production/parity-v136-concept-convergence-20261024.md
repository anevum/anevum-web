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

## V136.017.011 — stabilize true browser Studio evidence under GPU stress

The prior exact-head Chromium job `40149856378` passed all seven public widths, canonical routes, four WebGL scene families and GPU-loss handling. It later failed on the **private Studio screenshot command** after Playwright's default 30-second screenshot timeout (the full browser had already exercised many SwiftShader software-GPU contexts). The private source workstation should never need an active WebGL context: its existing fixture now forces the same fully supported accessible vector fallback, without changing studio rendering or checking less code. A bounded 90-second screenshot timeout preserves a real browser-pixel acceptance gate rather than turning it into a source-only test or swallowing the failure. The public scene, mesh, hero, controller and explicit live-3D tests remain independent and fully GPU-backed.

## V136.017.012 — reactive candidate quality tier on real viewport changes

A responsive bug was identified in the original QA planetary root: the desktop/mobile mesh was selected only once during renderer initialization. Mobile rotation, browser-window resizing and TV viewport changes would retain the originally allocated tier, potentially burning desktop mesh resources on a narrow display. The existing Three.js renderer now owns a **single mutable candidate root** and replaces it on an actual `instituteBudget(...).tier` change. The retired candidate is removed and disposed before the replacement is mounted, preserving one canvas/context and the four approved GLB family routes.

The planetary factory now exposes its actual tier; executable geometry tests verify both combined candidate tiers, instance-adjusted triangle arithmetic, ten draw calls, and disposal. The compiled homepage browser checks 1440 → 390 → 1440 resize in one real WebGL context and asserts the correct tier after each transition. This change remains isolated behind `VITE_PARITY_V136_HORIZON_QA=true`, with the release-script rejection unchanged.

## V136.017.013 — camera-visibility correction to real floating architecture

A placement audit exposed a geometry-visibility defect: the first procedurally instanced floating outposts were authored with `y<-9` and several `z>0` while the camera sits near `(0,3,13)` looking toward negative Z. Their triangle counts passed but the platforms could be off-screen or behind the camera. The native staged positions are now staggered in the useful right/bottom half of the real hero camera across depths, without obstructing the left-aligned public copy.

A Three.js regression test reads the actual instanced deck matrices, applies the same V136 hero camera position, look-at and device FOV, projects the platform centers into normalized screen coordinates, and requires at least two genuinely visible outposts at both 1440x892 and 390x782 and one visible on the art-side. This is a *visibility* contract, not a claim the resulting composition is artistically finished. It does not alter input gestures, account data, the GLB cache or QA release isolation.

## V136.017.014 — native Node and Vite geometric source parity

The first combined geometry test imported `InstituteHorizonV136017.ts` directly in Node's `--experimental-strip-types` mode, exposing an extensionless runtime import that works in Vite but **does not resolve in Node ESM**. No test-only fake module, alias, or global TS configuration change was introduced. Instead, the existing renderer injects the actual first-party citadel factory into the planetary horizon; that module keeps only a type-only import (removed by Node's type stripper). Its exported dependency is the genuine `createInstituteCitadels` passed by both Three.js rendering and the geometry test.

The one-canvas renderer now supplies the factory when creating the QA horizon at initial load and when switching desktop/mobile tiers. Node's geometric resource test exercises the same real module without a bundler, while Vite still resolves the renderer's normal imported factory. The public/protected runtime flags and artifacts are unchanged.

## V136.017.015 — fix world-space compositing of the architectural QA scene

A real scene-hierarchy defect bypassed the previous camera-projection test. The combined planetary root was translated to `(17,12,-35)` on desktop (`(10,12,-35)` on mobile), and the citadel instances were later attached beneath it. Consequently, the citadel positions that passed isolated camera tests became different world coordinates in the active renderer. This is a correctness/visual issue, not a cosmetic preference.

The combined environment now has a neutral world root with two independent children: the offset gas-giant/observation-ring group, and the camera-authored suspended-architecture group at its intended world coordinates. This preserves original geometry, two responsive tiers, draw counts, resource disposal, and the existing one-canvas renderer. The executable camera regression now constructs the **entire** QA environment, reads each real deck's `InstancedMesh` matrix and composed `matrixWorld`, and projects those world positions through the actual desktop/mobile hero cameras. It also checks that the gas giant remains behind the architecture, and that final disposal empties the root. No runtime access or production flags changed.

## V136.017.016 — prevent planetary volume from swallowing visible spires

The combined-world camera test can establish an onscreen position without proving the planet isn't physically occluding the architecture. After the hierarchy fix, one desktop outpost at `(10.9,0,-30)` was actually inside the gas giant's radius around `(17,12,-35)`. Its projected screen coordinate alone looked valid even though the object would be behind/inside the planetary body. An additional mobile outpost had limited atmospheric clearance at upper tower levels.

The two farthest placement entries move to `z=-21.5` (desktop) and `z=-24` (mobile). The **same assembled scene regression** now inspects the world-space matrices of every instanced platform center and every individual auric spire center, compares them to the real atmospheric sphere's geometry radius, and requires positive clearance. This is a concrete depth-compositing and visibility fix rather than a new visual theme. Geometry complexity, GPU draw batches and producer gates are unchanged.

## V136.017.017 — sculpted suspended architecture within the same GPU ceiling

Session: `ANEVUM.WEB.BUILD.2026-10-24.007.CONCEPT-CONVERGENCE-FOUNDATION`.
Recovered and visually inspected the original Floating Institute reference (`libfile_e379c9ee00fc8191a3f49784b31e747e`), Creator Universe Dashboard and Neon UI Showcase. The prior procedural cylinders/cones lacked the reference's stepped platforms, hanging fractured rock and differentiated tower profiles. The actual instanced mesh factory now authors indexed lathed terraces, tower cornices, auric crown collars and asymmetric suspended geological shards. Fixed per-instance fixture colors distinguish warm platform illumination from cyan/violet windows without new textures, shader loops or activity claims.

The complete optional horizon remains six architecture batches plus four planetary batches: **24,276 triangles / 10 draws desktop; 8,200 / 10 mobile**, below the unchanged 25k/10k ceilings. Tests count real instances, check downward geological taper, full composed camera/atmosphere clearance, color attributes, and disposal of all six geometries and four shared materials. Existing original GLB variants and all production flags are unchanged. This candidate still requires direct browser-pixel comparison; additional geometry alone is not AAA acceptance.

## V136.017.018 — real source navigation and per-file IDE continuity

Added a bounded local-file combobox with path filtering, real language glyphs, Arrow/Enter/Escape control, focus return and Ctrl/Cmd+P captured inside the source workspace (including Monaco). Selecting a nested file expands its actual parent folders. No synthetic files, command execution, account writes or publication actions are introduced. Monaco now preserves each mounted model's actual cursor, selection and scroll state across file switches, displays real line/column position, and clears saved states on model disposal/unmount. Source remains session-memory-only until explicitly exported/uploaded through the existing private workflow.

Compiled browser coverage exercises file search, no-match results, keyboard dismissal, direct Monaco shortcut, cursor restoration, existing archive compatibility and stale-build invalidation at 1440/390/320. Separate real-WebGL versus cinematic captures now include the governing **1536×1024** homepage viewport and 320px, in addition to 1440/390. These captures still require visual review; the original Blender candidate remains isolated. The interactive cloud preview currently cannot create a WebGL context, so its fallback view is not used as 3D acceptance evidence. The previous exact-head `c5438c5` spatial workflow completed successfully before this checkpoint was pushed.

## V136.017.019 — fix exterior occlusion established by actual browser pixels

The successful `c5438c5` Chromium artifact `12583640334` exposes a compositional failure that center-projection tests could not establish: the legacy Atrium nave/roof and its foreground armillary cover the new floating outposts. The live scene is visibly an enclosed hall rather than the approved open Institute exterior. Under the existing QA horizon flag on the hero route only, the renderer now retains but hides the old GLB family and decorative anchor spheres while drawing the authored exterior in the **same renderer and camera**. Other routes and all builds without the horizon QA flag keep their canonical geometry. The principal desktop island is widened to establish a stronger terraced silhouette without adding instances or triangles.

Actual browser acceptance checks rendered triangles against the unchanged candidate ceiling plus at most 128 compositor triangles, so an accidentally double-rendered Atrium cannot pass just by claiming an exterior data attribute. Separate poster/revealed/restored screenshots cover 1536×1024, 1440, 390 and 320. Studio evidence now selects actual nonempty `index.html` rather than the deliberately empty new Markdown note, exposing real syntax colors and editor sizing.

Candidate metal surfaces share the renderer's existing original brushed-alloy normal map (including its native compressed upgrade). Initial mount and viewport tier replacement both attach the same renderer-owned texture; no extra downloads, texture copies or ownership transfer. Candidate disposal frees its own materials, while the renderer retains sole texture disposal ownership.

The original optimized Blender stage was inspected from exact-head cinema artifact `12583081740`: desktop 1,384,624 bytes / 95,172 triangles / 26 primitives; mobile 769,260 bytes / 48,436 triangles / 18 primitives. It remains a separate opt-in QA asset in the existing renderer, not a production replacement. It is materially heavier than the current 397,820-byte / 41,820-triangle desktop Atrium and 189,252-byte / 16,844-triangle mobile asset, and its isolated camera pass does not prove reference-quality surface or silhouette fidelity. No additional renderer or runtime source is introduced by this correction.

## V136.017.020 — restore actual Monaco navigation/editing commands

Exact-head spatial run `40152564854` at `47505ddc` passed source/compiler/shader checks, all seven public responsive widths, navigation, native asset loading and GPU-loss handling, then failed the new `Ctrl+End` cursor test. Core commands were made explicit in the modular Monaco import, but the subsequent `ef8ae974` run showed that this did not resolve the failure.

Direct interactive browser inspection established the actual cause: Chromium's native EditContext is a `DIV[role=textbox]`, while `.monaco-editor textarea` selects a hidden **readonly IME** element. The harness had focused the wrong input. Tabbing from the selected file tab into the actual editor and pressing Ctrl+End moved the real cursor to `Ln 14, Col 1`; switching files restored that position and Ctrl+P opened the working local-file search. CI now uses that same keyboard path and asserts actual editor focus. The cursor assertion is retained. Studio and direct live-scene evidence run before the broad public GPU stress tests, so a focused regression fails promptly and preserves useful evidence. All original test groups remain.

## V136.017.021 — safe local preview model scope

The interactive HTTP preview uncovered a separate pre-existing crash: `crypto.randomUUID()` is unavailable on a non-secure preview origin, and evaluating it during render crashed the whole Studio route. Monaco model scope now uses React's per-mounted-component `useId()` with URI encoding. This is an in-memory model namespace, never an authentication/session credential. It preserves unique model ownership, disposal and no-persistence behavior without requiring a crypto API merely to display/edit source. The isolated debug API fixture was removed from the Vite configuration before commit; no fixture authentication or new backend permission enters source.

## V136.017.022 — bounded editor occurrence-highlight lifecycle

At `aa2baef0`, release browser run `40153949529` passed all three real Studio widths (including native cursor restoration and Ctrl+P), every public responsive width, navigation, GLB families, GPU loss, controller fixture and fallback checks. Its strict final zero-error gate then caught one unhandled `Canceled` rejection during rapid model switching. The compiled stack was resolved to Monaco's `WordHighlighter.dispose()` → `DisposableStore` → the unhandled automatic highlight `Delayer` cancellation. The installed source schedules that work on focus/cursor changes.

The local source editor now sets the public `occurrencesHighlight:'off'` option. This bounded workbench has no supplied semantic occurrence service; automatic occurrence decoration is optional. Syntax token colors, native Find, editing, selection, per-file cursor/scroll restoration, JSON validation, archive behavior and explicit model disposal remain. No global rejection handler or test-side cancellation filtering is added: the strict `errors=[]` browser requirement stays in place.

## V136.017.023 — direct live-pixel composition and atmospheric refinement

The actual `aa2baef0` 1536×1024 live-WebGL capture confirms that the roof correction exposes the original suspended architecture, but the principal island sits too low and the planet shows broad blurred noise cells. Raised and enlarged the primary desktop outpost within the same authored world/camera; camera and atmospheric-clearance tests still pass at 1536, 1440, 390 and 320. Reallocated the planet shader's existing **three** trilinear noise samples into warped higher-frequency cloud filaments, finer latitude bands and a deeper shaded terminator. No extra noise loop, texture, renderer, geometry instance or triangle is introduced. Budgets remain 24,276 / 8,200 triangles and ten environment batches. This is a visible composition/detail correction, not approval of final AAA-quality terrain or architectural richness.

## V136.017.024 — screenshot-reviewed hero-space balance and material study (draft)

The exact `0aa09b16` compiled screenshots at 1536×1024 and 390px were inspected directly after all eleven recorded workflows passed. They confirmed that the exterior is no longer occluded by the old nave, but the large close planet dominates the screen and the most useful island sits behind the mobile headline. This pass changes the **isolated QA-only world**, not the default cinematic homepage or canonical Studio: the planet is positioned more distantly to the art side with tiered smaller radii and rings, while the authored desktop and mobile floating platforms rise into the useful camera region. It adds a small number of hanging rock shards inside the existing instanced geology batch; profiles, exterior material palette and slender copper finials are sculpted/refined without a new material batch or context. The planet retains exactly three procedural noise samples but uses restrained auric/blue atmospheric belts in place of the previous high-contrast spotted surface.

The pure Three.js projection suite now tests platform placement in real responsive camera space and limits planet angular dominance rather than accepting any in-frustum geometry. The strict geometry, disposal, genuine WebGL, Studio, archive, mobile and release-flag checks remain. Actual compiled screenshot and performance acceptance on the new head is still required; final owner art approval and physical device frame rates are not claimed. `VITE_PARITY_V136_HORIZON_QA` remains release-forbidden.


## V136.017.025 — genuine in-memory source file management (draft)

The existing local Creator Studio source tree now supports **validated rename/move** of a selected non-entrypoint text file and explicit **confirmed removal**. Both operations change the actual bounded in-memory file map and invalidate any previously prepared archive through the existing `onDirty` callback. Renaming preserves exact source bytes and deterministic iteration order; destination paths must obey the canonical `safeSourcePath` allowlist and reject case-insensitive collisions. The root `index.html` cannot be renamed or removed. Rename warns that relative imports/links may need adjustment rather than silently rewriting creator code; deletion includes an explicit no-undo prompt and cancel path. Operations do not read other workspaces, persist files on a server, bypass 24-file/128-KiB/1-MiB limits, upload content, execute code or alter publication permissions. Both desktop Monaco and narrow accessible text-editor paths continue to use the same source map. The original compiled-browser QA adds actual 1440px rename, confirmed deletion and cancellation interactions; a pure source test proves archive round-trip of surviving files. Real CI completion remains pending for this head.

## V136.017.026 — preserve strict release/source gates for file operations

The initial V136.017.025 exact-head CI failed at the *source contract* and *release allowlist* gates, before browser execution. The new CSS assertion was erroneously reading the separate concept stylesheet instead of the existing local Workbench stylesheet, where the controls actually live. The release packaging audit correctly rejected the unlisted newly authored `workbench-file-ops-v136.ts` file. This patch targets the real stylesheet and adds only that reviewed module path to the pinned file allowlist. No removal of either test and no widening to directories, packages or auth paths. The next exact-head CI must still pass browser interaction and runtime checks independently.

## V136.017.027 — native Node type-stripping import correction

The initial `477067f5` source archive test failed to resolve the extensionless `./source-archive-v136` import inside the new TypeScript helper under Node's `--experimental-strip-types` runner. The helper now receives the **existing canonical** `safeSourcePath` predicate explicitly from the owning ArtifactWorkbench, while direct unit tests pass that same export from the source archive. It no longer has a Node-incompatible extensionless import or a shadow/duplicate safety regex. Release allowlist, archive parser and private source boundaries are unchanged. The previously observed Aura Codex visual timeout is tracked independently; it is not evidence this helper modified the Aura Codex.

## V136.017.028 — stronger true 3D Institute massing and optical framing (draft)

The fully passing `fe6075f2` browser evidence was visually reviewed at 1536×1024 and 390px. It showed that the planetary surface still occupied an excessive part of the art field and that the mobile island deck crossed behind the first line of the editorial heading. The QA-only scene now scales the planetary sphere/atmospheric edge/rings back to a distant stage element and reduces globe tessellation so the same ten draw batches can spend additional triangles on **actually modeled** multi-ledge tower shaft, crown and shattered geological profiles. Wider central/secondary towers and correctly external photonic inlays address the overly thin repetitive spire appearance. The mobile principal island rises in authored camera space, with the optical frustum assertion strengthened to prevent the deck sliding behind first-screen copy. The fragment shader uses exactly three existing procedural weather samples for calmer gas-giant latitude flow rather than strong noisy cell patches. The test raises only the per-citadel geometry allowance to reflect a deliberate shift from planet detail into architecture; the original overall `25,000/10,000` triangle, ten environment draw-call and compositor ceilings remain unchanged. No second renderer, remote media, production flag, member content or permission change. Browser review of the new exact head is still required; concept-art parity and physical device FPS are not claimed.

## V136.017.029 — local source reference review utility

Adds a read-only helper to identify obvious file references before rename operations, with no automatic rewriting of creator-authored source. This is a conservative reference scan, not a complete JavaScript/CSS/HTML parser. The draft remains QA-only and must pass exact-head checks before acceptance.


## V136.017.030 — in-place authored-source dependency warning (draft)

The real Creator Studio's existing rename and confirmed-remove dialogs now display a read-only **link audit** derived exclusively from the current bounded in-memory source map. It resolves statically quoted HTML/CSS/JS local paths in each referencing file's directory, including sibling, `../` and root-relative references, without interpreting remote URLs as local. Any matching source filenames are displayed before the change and repeated in the post-action notice; there is no automatic source rewrite, execution, upload, persistence, or additional API. The empty result explicitly states that dynamic paths are not inspected. Node regression tests verify relative path resolution and immutability, and the existing compiled 1440px Studio Chromium acceptance now tests a real `index.html` → `styles.css` dependency in both rename and removal prompts, plus cancellation. Scoped alloy warning styling includes forced-colors fallback. Strict release allowlist, 24-file/128KiB/1MiB limits, private session and release-forbidden WebGL flags remain unchanged. Actual exact-head CI is required for acceptance.


## V136.017.031 — real dependency navigation and cancel safety (draft)

The warning chips in both source rename and remove dialogs are now functional buttons. Selecting a related source opens that **actual** local file in the existing Monaco/fallback editor, expands its real folder hierarchy, focuses the existing selected file tab, and cancels the pending destructive/renaming operation. A notice explicitly tells the creator what to review and confirms no source text has been rewritten. This is a private, in-memory UI operation; it adds no renderer, network, project API, persistence, publish action or new source-path grammar. Compiled Chromium acceptance at desktop 1440 tests both navigation paths and confirms that neither the original stylesheet nor its HTML reference is removed. Source-contract test covers the exact implementation and accessibility styles. The previous static warnings and all immutable release guards remain. Exact-head CI must pass before release consideration.

## V136.017.032 — reject plain-text dependency false positives

Exact-head `4644d48c` native CI found an actual scanner false-positive: a prose `.txt` file containing `url(styles.css)` was treated as a live source-code dependency. The audit now inspects supported executable/metadata source extensions (`.html`, `.css`, `.js`, `.json`) but does not interpret plain text or Markdown notes as code. CSS's unquoted `url(...)` syntax is scanned only in CSS files. Real HTML and JS references still resolve; the canonical zip parser, path allowlist and authored contents remain unchanged. Preserve the existing strict regression assertion and add explicit documentation false-positive coverage. The latest head requires fresh exact-head CI and browser review.

## V136.017.033 — mobile secondary island must clear headline (draft)

Visual review of the latest exact-head V136.017 browser evidence (390px) showed the **secondary mobile floating outpost**, not just the main citadel, behind the main editorial headline. The previously written frustum/planet test only constrained the primary island and allowed that overlap. Raise the secondary actual 3D island to a high left-hand sky position while keeping its existing world-space depth, radius, material batches, triangle count and animation contract. Extend the deterministic **actual composed camera** test at 390 and 320 to assert that the second deck occupies the opposite lateral column and clears the headline's vertical region. This remains the QA-only original geometry in the existing renderer; no CSS visibility trick, additional GPU context, route change or production flag. Full screenshot and physical-device acceptance still required.


## V136.017.034 — live static-link diagnostics in the actual Studio inspector (draft)

The existing bounded in-memory source inspector now derives and displays **missing relative or root-relative text-source dependencies** from statically declared HTML `src/href`, CSS `@import/url()`, and JavaScript `import/export/require` paths. It reuses the existing canonical safe-source-path validator and reference path resolver, skips dynamic/remote/unsupported binary resource paths, and deduplicates per-source/target warnings. Creators can click a warning to open the genuine file in its existing Monaco or accessible text-editor tab and inspect the reference; there is no rewriting, execution, uploads or account persistence. Scanning is memoized by local source-map identity. The diagnostics are explicitly **advisory**, not a new validator or packaging gate, because dynamic dependencies cannot be exhaustively established from this limited syntax analysis. Regression tests verify missing/satisfied source links, noninterference with Markdown/plain-text notes, case-sensitive archive behavior, immutable file contents and actual 1440px compiled Studio link navigation/dirty-state preservation. No routes, renderer, auth, dependency versions, or release flags change. Exact-head tests and reviewed browser evidence required before acceptance.


## V136.017.035 — authored planetary headline clearance and layered decks (draft)

The fully passing `f40ec2d1` compiled WebGL screenshots were inspected at 1536, 390, and 320 CSS pixels. Although the main/secondary mobile islands now occupy the sky above the title, the gas giant still extended through the mobile headline's first line. This QA-only pass shifts the mobile planet **up and slightly outward** in actual 3D camera space, reduces its sphere/atmospheric shell radius and scales the two orbit radii consistently; the existing real environment, desktop geometry, single renderer and public poster presentation remain unchanged. Mobile scene now has a *camera-projected lower-silhouette clearance gate*, not only the earlier angular-size check, at both 390px and 320px. The planet retains exactly three fragment-noise samples but lessens high-contrast weather distortion to favor broad atmospheric bands. The existing instanced floating deck receives four additional physically modeled stepped ledges **within its original draw batch** (no extra draw call, texture, context or user-derived data). Geometry, per-tier draw counts, disposal tests, strict release-forbidden flags, reduced-motion and GPU limits are still enforced. The next exact-head CI and compiled image review determine acceptance; mobile Safari / physical-device performance and approved AAA concept parity are not yet claimed.


## V136.017.036 — actual sculpted geology material strata and cathedral windows (draft)

In the already-isolated authored Institute WebGL scene, the suspended broken-rock geometry now carries deterministic **per-vertex mineral strata colors** that follow the actual deformed indexed lathe positions. A bounded cool-slate-to-abyss ramp, subtle original ochre seam bands and per-instance weathering tints make the modeled geology legible under existing lights, without adding textures, remote assets, shader samplers, geometry, runtime telemetry or a seventh structural batch. Tall, narrow photonic window inlays replace the original tiny square points **using the same indexed 12-triangle box**, so real building floors become more visible at native presentation resolution. This is not an extra shader pass or CSS artwork. The original 6 instanced architecture batches and 10 entire-environment draw-call budget are unchanged; static colors are computed once, and the existing disposal path owns the buffers. Deterministic tests verify colored vertex count, altitude-dependent mineral contrast, tinted shard instance attributes, vertical window aspect and identical triangle cost. Existing QA flags remain release-forbidden, private source and auth boundaries unchanged. This pass requires fresh exact-head CI and desktop/mobile rendered review before it is accepted; no production deployment or final concept parity is implied.


## V136.017.038–039 — UI-first mobile repair and author thumbnail defaults

The UI-first `5009333d` checkpoint passed nine of eleven workflows but two full browser suites found actual horizontal page overflow on the 320px private Creator Studio. The next `2bc5ef42` commit removed the duplicate fixed world-navigation dock while the canonical file workbench is active, corrected the missing gamepad icon and added detailed browser diagnostics; that run passed the 1440px/390px source workbench but still reproduced **three CSS pixels** of 320px overflow. The new diagnostics implicate narrow-screen authored shell geometry rather than the GPU; its generic SVG-path candidates are not element-layout evidence. This pass restores the source-of-truth 320px header lettering, actual reduced icon padding and tighter fixed-nav control spacing in the V136 scoped stylesheet. It also filters SVG-only drawing extents from the expanded acceptance diagnostic, reporting actual HTML layout rectangles, width, scrollable width and header/Studio boundaries if the defect recurs. The no-horizontal-overflow test remains strict. Do not solve by globally clipping HTML/body.

**Direction remains UI before art.** A first-party `CategoryCoverV136` replaces generated category-illustration images on the PARITY V136 homepage catalogue cards and category gateways, Discover filter tiles and approved-result cards, package gallery and public artifact inspector. Uploaded creator cover URL takes precedence where the approved browser-package API exposes one; a failed or missing cover falls back to the static type-default graphic. This placeholder is a deterministic, bundled vector/icon system in eight public directory types and four approved browser-release types, not a pretend screenshot or a generated planet/world. The legacy public catalogue API does **not** expose creator image URLs; its cards therefore transparently use the type default until that backend capability is separately designed and verified. Existing package access and public visibility contracts remain enforced; runtime preview or new network sources are not introduced. Default-off legacy React presentation for protected common cards remains as it was. Source unit tests assert coverage and deterministic fallback. No 3D renderer code, generated artwork, publishing rights, authentication rules or payment routes are changed.

**Acceptance required:** exact-head Node source contracts, native Creator/auth/release checks, and compiled Chromium desktop + 390px + 320px screenshots must pass before visual approval or deployment. If the narrow viewport still fails, use precise HTML offender diagnostics, not another art pass. The rest of the site still contains historical illustrative assets; this work is only the first V136 catalogue/UI replacement tranche, not a false claim of sitewide removal.

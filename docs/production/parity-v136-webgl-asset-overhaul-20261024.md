# PARITY V136.011 implementation register

Session: `ANEVUM.WEB.BUILD.2026-10-24.002.WEBGL-ASSET-OVERHAUL`

Authoritative source: PR #727, `integrate/parity-v136-multichat-20261024-010`.
Parents #725 and #726 are already integrated. Do not merge alternate scene engines.

## Completed source

- Search/navigation stabilization: Shell resets scroll/focus on pathname traversal only. Category/free/query updates retain the activating control. Regression asserts retained focus, encoded ampersand, preserved category/free parameters, actual filtered empty results, and no document reload. Initial remote correction: `a62e6fc150aafe622577ef616addc0b2f9ba75f2`.
- One dynamically imported Three.js WebGL2 renderer replaces manual context ownership in LivingWorldField. Existing analytic shader is retained as the atmosphere pass in the same renderer/context, not a competing canvas. React/DOM owns controls and route state; R3F/Drei would introduce a second lifecycle without improving this imperative persistent director, so they are not added.
- Four original modeled environment families: Atrium armillary cradle, structural rings/supports/transit platforms; Archive coffered perspective hall, layered catalogue shelving and holographic tables; Forge articulated fabrication gantry and machined workstations; Relay finned communication arrays and signal pathways. Holographic architecture is illustrative, not fabricated platform activity.
- Eight self-contained GLB assets, desktop/mobile detail variants, required EXT_meshopt_compression, clearcoat and emissive-strength material extensions. Reproducible original source and provenance live in `creator-v1/graphics/build-institute-assets.mjs`. All variants total 1,103,832 bytes; mobile per-family transfers 69–189 KB, desktop 90–398 KB. No concept image is passed off as a model.
- Physically based alloy, titanium, auric metal, ceramic, photonic and optical materials; procedural HDR environment generated locally with RoomEnvironment + PMREM; ACES tone mapping; directional/key/rim/point lighting; desktop luminance-threshold bloom and output conversion. No server GPU or remote inference.
- Shared optical DOM materials for the persistent console, Arrival, Discover, Artifact Lens and private Studio chrome. Mobile Arrival reserves a scene window above readable copy; desktop keeps text and modeled architecture in separate composition regions.
- Instanced repeated geometry, abortable public static-asset reads, lazy family loading, two-family resource cache, explicit mesh/material/render-target disposal, independent DPR/pixel caps, 60/30 scheduling targets, sustained-frame-time quality downgrade, hidden-tab suspension, static reduced-motion rendering, Save-Data vector fallback and context-loss fallback.
- Asset inspection gate checks hashes, lengths, GLB structure, required geometry compression, retained material extensions, missing references and per-device triangle/transfer budgets. Production browser acceptance now exercises actual compressed meshes in all four families, persistent canvas identity, bounded resource cache, pixel allocation and deliberate GPU context loss. Standalone shader compilation remains useful but is no longer the only rendering evidence.

## Active verification

- Exact correction head CI and exact mesh head CI must be evaluated separately. Do not infer mesh acceptance from earlier shader-only checks.
- Local TypeScript and Vite production build pass before publishing the mesh increment. Full legacy protected-system and remote browser workflows remain required.
- Local managed preview returned a URL then stopped; cloud browser returned connection refused. No alternate local browser path or network permission bypass was used. GitHub Actions browser evidence is required for visual QA while this environment limitation persists.
- CI metrics distinguish CPU submission time and frame interval from true GPU timing. Software-GPU CI cannot certify physical 60 fps desktop / 30 fps mobile.

## Governing references and remaining fidelity gap

Recovered and inspected original board `ANEVUM Parity V136 Neon UI Showcase.png` (`libfile_66e0cab1cfbc8191b5eb13ed678da923`); recovered `ANEVUM Parity V136: Creator Universe Dashboard.png` (`libfile_f70fb019b5b48191a029ec67b45ddbe5`). The register also names boards `libfile_9cdf13e3cd9c8191bdbe977dc11f8d4e` and `libfile_5a835586bc1881918421842c11e46f33`; these must still be visually inspected. Existing arrival JPGs are implementation screenshots, not governing concept boards. Concept statistics, fictional users and illustrative feature availability are never imported as real data.

The mesh architecture is a real fidelity step, not completed AAA visual acceptance. Detailed sculpting, baked/painted surface maps, GPU-compressed KTX2 texture variants, native mobile Safari tuning, final identity/insignia models, and comparison of real browser captures against every governing board remain unfinished. Current materials use authored PBR parameters; no claim that texture production is complete. No native 4K texture claim.

## Remaining product implementation

- Reconcile prior Studio V115–V122 source editor components against current native build contracts; do not blanket-import PR #709 or change uploader/auth/moderation/publication permissions. The existing private explorer and canonical editor remain session-bound.
- Build functional source workbench/editor and authorized live preview through the canonical sandbox; add semantic file icons and asset/validation inspector. Never execute creator code in ANEVUM's origin or feed private files into the public renderer.
- Extend finalized identity capsules, recognition sculptures and graphical details only through verified public/entitlement fields.
- Integrate IREN announcements only through independently verified existing services. No new consent schemas or messaging service activation in this visual increment.
- Complete desktop/mobile visual iteration, high-contrast and screen-reader review, actual-account isolation tests, physical Safari, GPU timing and memory soak tests before promotion.

## Production boundary

Fresh provider read: deployment `f2f950d8-8ec6-42cd-80c2-06681ad2fcf9`: V136.003 `72f35ec3-e046-4f75-ae65-19fa672b87c9` 99%, V136.005 `cf058439-2487-4b96-b183-94a5c419f3cb` 1%.
No upload, activation or traffic change by this increment. Existing release preflight expects the older 100% V136.003 allocation and must fail closed until a separately verified bounded preflight update reflects the actual provider state. Protected gateway, bindings, routes, payment/auth/database/XP/moderation/publication/family systems remain untouched. Keep both current live versions as rollback.

## Status distinctions

- Completed: source corrections, modeled assets, compressed model pipeline, renderer and optical component implementation described above.
- Active: exact-head CI, actual render inspection and measured visual iteration.
- Future: remaining workstation/identity/texture/surface work above; none is implied live.
- Superseded source lanes: alternate public renderer #723 represented by #725; #725/#726 already consolidated. Other Studio, announcements, payment and family PRs remain distinct scopes.

## Verified mesh checkpoint and workstation increment

- Exact mesh source `faf62651ddd1a64861a4b434429e29811f0e03dc`: Spatial QA run `40131930158` passes its actual compiled UI step, all six sizes, all four real mesh families and deliberate context loss. Desktop scenes submitted 24–44 draw calls; mobile scenes 11–31 in this software-GPU fixture. These counts demonstrate instancing and actual geometry, not hardware FPS certification. Subsequent refinements remove duplicate analytic architecture from the atmosphere pass and add deterministic mipmapped brushed-alloy normal surfaces.
- The first mesh snapshot exceeded the existing 690px desktop hero budget. Source composition was corrected instead of relaxing that acceptance. A source transfer initially omitted the typed manifest file; corrective commit `a32dec8952f49ca221e87b811e9c67de4778cca1` restores it and its complete Git tree exactly matches the locally verified tree. Historical failed checks remain visible.
- Search correction `9ed031a2d36fd38ec25517b2df0ba18bb2ede882` passes the original targeted Discover acceptance. Focus retention alone did not resolve the controlled-input failure. Replacing the experimental React ViewTransition wrapper with a stable DOM route surface and pathname-only Web Animations resolved the reproduced issue without native document reload or weaker query checks.
- Added an actual `ArtifactWorkbenchV136` to the existing, session-bound native creator build form, visible only with full PARITY and existing authorized pilot access. It uses Monaco on desktop, an explicit accessible text editor and phone default, semantic HTML/CSS/JS/JSON file glyphs, file explorer, roving source tabs, JSON worker diagnostics, source metadata inspector, local text import and archive export. There is no decorative code screenshot.
- The workbench reuses the exact pure V119 language module from PR #709 / `46bf8518307c8e6c3584d6c72031f660509c334f`; it does not blindly import V111 file service, V112/113/115 documents, native revisions or their backend migrations. Existing V115–V122 authored world/file persistence remains a separate integration boundary, now concretely recovered and inspected.
- Preparing an archive feeds the existing native ZIP compatibility inspection. Publication rights remain unchecked; the user must separately confirm and explicitly invoke the canonical private upload. Editing source invalidates the prepared archive and clears rights. Local tests verify byte-preserving ZIP roundtrip, canonical compatibility, entrypoint, path traversal rejection and bounded payloads. No code is executed in the ANEVUM origin. Live executable preview continues to use the existing canonical isolated playtest, with its unchanged sandbox, ownership and moderation rules.
- Source lives only in the mounted account-keyed workspace; no localStorage, analytics, external compiler, generated AI output or shared renderer receives it. Imported files are read on this device. Signing out/remount disposes Monaco models. A source download allows export before leaving, and unsaved source triggers the existing style of leave warning.
- Monaco core, languages and its 280KB editor / 410KB JSON workers are separate optional chunks, loaded only on deliberate desktop workstation entry; phones retain text editing unless explicitly switched. The largest optional Monaco library chunk is ~3.6MB uncompressed / ~924KB gzip, a material cost that must remain lazy and must not enter public page startup.
- Renderer metrics now separate animated frame intervals, CPU submission time, asynchronous GPU timer query results when supported, geometry/texture counts, context losses and quality scale. Static reduced-motion event gaps are excluded from frame-rate measurements. Instanced-mesh buffers are explicitly disposed on eviction; forced-colors skips GPU allocation.
- Expanded browser acceptance covers the actual session-bound source form at 1440/390/320, real Monaco presence on desktop, text editing on phones, native compatibility, mandatory rights/explicit-upload boundary, stale-archive invalidation, no page overflow and no private source in the public world. Exact workstation-head results remain required before release.

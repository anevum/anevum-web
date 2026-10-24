# PARITY V136.011 implementation register

Session: `ANEVUM.WEB.BUILD.2026-10-24.002.WEBGL-ASSET-OVERHAUL`

Authoritative development: PR #727, `integrate/parity-v136-multichat-20261024-010`.
PR #725 / #726 are already consolidated. No sibling renderer or old Studio branch was merged again.

## Completed and verified source

- The original Discover submitted-query failure was an application defect: React's experimental ViewTransition route wrapper discarded controlled search state. `9ed031a2d36fd38ec25517b2df0ba18bb2ede882` replaces it with stable DOM and pathname-only Web Animations, focus and scroll. Query/filter edits retain focus; encoded `ORBITAL & TEST`, category/free preservation, real filtered results and same-document navigation remain acceptance requirements. The earlier focus-only fix `a62e6fc` was insufficient. Legacy direct route-child structure is preserved when full PARITY is off.
- One persistent Three.js WebGL2 renderer in `InstituteRendererV136.ts` owns the existing LivingWorldField canvas. React owns semantic DOM/interaction; R3F/Drei were evaluated but would add a second lifecycle without helping this persistent imperative director. The existing analytic shader is retained as atmosphere only, without duplicate analytic architecture.
- Four modeled families: Atrium armillary cradle, orbital supports and transit nave; Archive layered catalogue shelves, holographic tables and perspective hall; Forge articulated fabrication gantry, reactor and workstations; Relay finned communication arrays and illuminated pathways. Route/filter transitions change the family within the same canvas/context. These architectural motifs do not impersonate real public activity.
- Eight original desktop/mobile GLBs use required EXT_meshopt_compression and clearcoat/emissive-strength material extensions. Combined GLB size: 1,103,832 bytes. Individual mobile families: 69–189 KB; desktop: 90–398 KB. Reproducible source, integrity manifests, provenance and preserved dependency licenses live in `creator-v1/graphics` and `web/public/assets/institute/v136-011`.
- Original brushed-alloy normal surfaces: ASTC, BC7 and ETC2 native GPU KTX1, full mip chains, 256px mobile / 512px desktop. Only the supported variant downloads: 87,508 / 349,656 bytes; unsupported devices retain deterministic procedural normals. Offline Basis UASTC encoding avoids a runtime Wasm transcoder. Pinned package `basisu@1.16.3` bundles a Linux encoder identifying itself as v1.15; the manifest records both honestly.
- PBR alloy/titanium/auric/ceramic/optical/emissive materials, local RoomEnvironment PMREM lighting, ACES tone mapping, directional/key/rim/point lights and desktop luminance-threshold bloom. All rendering is on the visitor device; no server GPU or inference service.
- Mesh instancing, abortable lazy public assets, two-family cache, explicit geometry/material/InstancedMesh/render-target disposal, desktop/mobile pixel and DPR caps, hidden-tab suspension, 60/30 scheduling targets, sustained slow-frame adaptation, reduced motion, Save-Data, forced colors and context-loss vector fallback. Metrics separate frame intervals, CPU submission, asynchronous GPU queries, memory counts and context losses. Software-GPU results do not certify physical FPS.
- Shared optical DOM materials improve the persistent console, Arrival, Discover, Artifact Lens, private Studio chrome and existing compact identity surfaces. Existing identity fields, entitlement ownership, navigation semantics, readable forms and permissions remain canonical.
- A real session-bound Artifact Workbench composes bounded local HTML/CSS/JS/JSON source into the existing native ZIP compatibility flow. Monaco is lazy on desktop; phones default to accessible text. Same-origin editor/JSON workers, semantic file explorer, keyboard source tabs, file import/add, JSON diagnostics, inspector, archive export and stale-archive invalidation are implemented. Preparing an archive does not confirm rights or upload it. Source edits clear prepared upload state and rights. Account-keyed memory and leave warning preserve isolation; no source is sent to public graphics, localStorage, analytics or external compilers.
- Recovered PR #709 / `46bf8518307c8e6c3584d6c72031f660509c334f` V111–V122 sources. Reused its exact pure V119 language module; did not import backend-dependent revisions/file APIs or migrations. Executable preview remains the existing isolated private playtest, reached after canonical upload. This increment does not implement new server source persistence or an in-origin code runner.
- Production HTML CSP was read directly: `script-src 'self'`, without Wasm or blob workers. An upstream Meshopt JavaScript reference decoder now runs in one same-origin external worker with bounded synchronous fallback. Every accessor of all eight GLBs is equivalence-tested against optimized Meshopt. Full browser fixtures now serve that exact policy; no gateway/security-header exemption was added.

## Verified checkpoint

Application code: `bb474d284bac0a755f220ca10b670a756376fe87`.
All 14 GitHub workflows passed at this exact head, including:

- Spatial QA: https://github.com/anevum/anevum-web/actions/runs/40134305857
- Targeted release/package and Discover acceptance: https://github.com/anevum/anevum-web/actions/runs/40134305909
- Existing V104 IREN/frame/private recovery: https://github.com/anevum/anevum-web/actions/runs/40134305820
- Creator V1 verification: https://github.com/anevum/anevum-web/actions/runs/40134305745
- Remaining auth, D1, rewards, member, native, compatibility, workbench and recovery checks also passed.

46 local source/archive/decoder/protected tests, TypeScript and Vite production build passed. Browser acceptance covers 1920/1440/1024/768/390/320px, four actual mesh families, native compressed texture upload with GL error zero, one persistent canvas, bounded model cache and pixel allocations, deliberate context loss, actual Artifact Lens data/canonical links, real desktop Monaco, phone text editing, valid native ZIP, no automatic upload, mandatory rights and stale archive invalidation. Fixture data is synthetic acceptance data only, never production activity.

At this head the software-GPU mesh fixture submitted 12–45 draw calls and 6,175–42,100 triangles per family. Timing queries on this software renderer are not physical-device performance evidence. Capture artifacts: Spatial `12576267542`, targeted package `12576542050`, targeted browser `12576272667` (14-day CI retention).

Visual inspection found one evidence race: a ready Archive mesh was captured while its lazy DOM route still displayed Suspense. The next checkpoint strengthens capture readiness to require the route's actual heading; it does not relax functional or rendering checks. A bounded workstation viewport capture replaced an expensive full-document Monaco screenshot while preserving editor, archive, layout and permission checks.

## Governing references and visual gaps

All four original 1536×1024 governing boards were recovered and visually inspected:

- Neon UI Showcase: `libfile_66e0cab1cfbc8191b5eb13ed678da923`
- Creator Universe Dashboard: `libfile_f70fb019b5b48191a029ec67b45ddbe5`
- Neon Creative Universe: `libfile_9cdf13e3cd9c8191bdbe977dc11f8d4e`
- Dashboard Showcase: `libfile_5a835586bc1881918421842c11e46f33`

Actual browser captures show a dimensional nave/armillary, distinct modeled environments and a functioning source editor. They still lack the concepts' sculpted floating citadel complexity, painted/baked surface richness, integrated dense workstation composition and final detailed insignia. This is a substantial implementation increment, not completed AAA visual parity. Original concepts' fictional creators, statistics, achievements and payments were never imported as real activity. Existing arrival JPGs are implementation screenshots, not governing references.

## Release and live state

Provider-confirmed deployment: `f2f950d8-8ec6-42cd-80c2-06681ad2fcf9`:

- 99% V136.003: `72f35ec3-e046-4f75-ae65-19fa672b87c9`
- 1% V136.005: `cf058439-2487-4b96-b183-94a5c419f3cb`

Provider preflight verifies all 26 binding signatures against sealed V131, 40 routes, original controller `4c832ec7-ce67-4864-832c-9b0b470af92d`, public signup/prelaunch and disabled XP/test uploads. The release helper now requires this exact observed 99/1 pair rather than stale 100% allocation; other comparisons remain strict. Sealed gateway SHA256 stays `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99`; 152 earned-media files remain unchanged.

The new `release/parity-v136-institute-20261024-011` lane points to authoritative integrated source and adds only another exact branch/message trigger to the existing verify/package/inactive-upload workflow. It does not merge or force-rewrite old release branches. It performs a fresh full verification and before/after provider audit, uploads with `versions upload --keep-vars --strict`, and cannot allocate traffic. Original production pair remains rollback.

Public HEAD/GET and version-pinned readbacks currently return Cloudflare 403 / `error code: 1010` from this execution environment. Do not change WAF/security policy to bypass that rejection. Zero-traffic upload may be prepared, but canary activation is blocked pending successful deployed readbacks and cross-version hashed-asset delivery verification. A passing loopback fixture is not live acceptance. No traffic activation is authorized by a package receipt alone.

## Active work / future work / obsolete lanes

- Active: exact next-head capture/release checks, protected zero-traffic upload receipt and provider readback; final screenshot inspection and durable evidence links.
- Blocked production verification: live public requests rejected with 1010; verify both active versions can serve all candidate entrypoint/chunk paths before any traffic allocation. Do not assume version affinity.
- Future product work: final sculpted assets/material maps/recognition models, richer user-selected Identity Capsules from verified fields, deeper Observatory/Commons/profile/supporter composition and independently verified IREN announcements/services. Current shared materials do not imply every surface is redesigned.
- Future Studio work: authorized server project-file persistence, complete existing V115–V122 native integration, richer asset management and dimensional sandbox preview. Existing upload/ownership/moderation/publication remain unchanged.
- Required before broad promotion: physical Safari/touch/high-DPR testing, actual-account isolation acceptance, screen-reader/high-contrast review, input/CLS and GPU/memory soak measurements. No claim those have passed.
- Obsolete integrated lanes: #723 represented by #725; #725/#726 already included in #727. Separate Studio/announcements/payment/family branches remain outside this increment. No second renderer introduced.

## Split-version asset compatibility increment

Read-only comparison of the exact provider-linked package artifacts established that their only conflicting shared path is `index.html`, while each build has different hashed chunks. V136.003 lacks 16 candidate entrypoint assets and V136.005 lacks 14. This is an offline inventory finding, not a claim that a live request returned 404. Existing affinity behavior is unverified because public readbacks return 1010.

`parity-v136-asset-pair.mjs` now constructs two frontend packages: byte-identical verified V136.003 HTML with additive static assets, and the current candidate HTML. Both have the same complete old/new asset inventory. It fails closed on any differing shared static path, symlinks, stale output, wrong pinned source, inventory digest, gateway bytes or changed earned media. Four local tests exercise both HTML entrypoints, cross-version chunk availability, collisions, symlinks and stale output. Actual retained packages produce 489 identical shared files, preserve baseline entrypoint bytes and all 152 earned-media hashes.

The protected workflow now downloads the exact old verified packages, builds this pair, and uploads baseline-assets-only and candidate versions independently at zero traffic, with a fresh strict before/after provider check for each. A pair does not authorize activation or change live allocation. Any earlier unpaired inactive candidate is superseded for canary use. Both new versions must have matching shared inventory receipts and pass deployed readbacks before the original 99/1 pair can be replaced.

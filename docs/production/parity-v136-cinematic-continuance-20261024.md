# PARITY V136.013 — CINEMATIC CONTINUANCE ENGINE

Session: ANEVUM.WEB.BUILD.2026-10-24.003.CINEMATIC-CONTINUANCE-ENGINE
Date: 2026-10-24
Repository: anevum/anevum-web
Source: build/parity-v136-cinematic-continuance-20261024-013
Upstream: PR #727 (consolidated WebGL/Studio) → PR #728 (controller bridge) → this bounded cinematic branch.
Status: Source implementation / DRAFT; never a claim of live promotion, finished AAA assets, or validated mobile Safari.

## 0. Decision and non-negotiable product intent

Continue the actual Continuance Institute rather than replace it with a film or a static marketing landing page. The exterior can be art-directed and prerendered; its interior is genuinely interactive. Real users, creations, navigation, IREN, publishing, identity, permissions and recognition remain authoritative in their original services and accessible React DOM.

**One continuously mounted canonical WebGL context. One React Router. One set of DOM actions.**

Adopt the strongest principle of the Draftly-like output model: author high-quality, deliberate scene imagery, motion, lighting and depth *before* integrating the interface. Do not mistake an analytic procedural renderer for high-quality authored art. Do not create a second WebGL universe or assign privileges/statistics to GPU pixels.

**Locked:** the four visual sectors and long-lived scene director; canonical public data inputs; member/creator security boundaries; source edit/upload rights handling; reduced-motion, Save-Data, forced-colors and context-loss fallbacks; gamepad-to-DOM semantics; existing Cloudflare gateway, D1/R2, earned media and payment integrations.

**Changed direction:** establish an owned 2.5D/3D cinematic content pipeline + deliberate compositing above the single existing renderer, with visual fidelity measured against the four 1536×1024 governing PARITY V136 boards rather than merely passing WebGL smoke tests.

**Not authorized:** public traffic promotion, WAF bypass, security policy relaxation, third-party image/video subscription purchases, Cloudflare changes, synthetic content populated as live, paid video generation, server-side GPU streaming, or unsafe runtime creator execution.

## 1. Governing board evidence / design system

Recovered concept sources (2026-10-24 visual review):
- Neon UI Showcase: ANEVUM Parity V136 Neon UI Showcase.png
- Creator Universe Dashboard: ANEVUM Parity V136: Creator Universe Dashboard.png
- Neon Creative Universe: Anevum Parity V136: Neon Creative Universe.png
- Dashboard Showcase: ANEVUM Parity V136 Dashboard Showcase.png

These boards are *creative objectives*, not live product screenshots and not proof of implemented fictional creator metrics, payments, games or social posts. Required qualities:
1. Large composed Institute exterior, floating citadels and orbital/nav structures; painterly blue/cyan/violet light with amber focal cues and believable material occlusion.
2. Readable AAA console hierarchy: engineered chrome, engraved channels, beveled alloy, shaped optical glass, restrained phosphor energy, typography that serves hierarchy rather than generic sci-fi microtext.
3. Meaningful dense interfaces: editable source, live preview, real project and creator information, Forum discussions, verified recognition, IREN communications, mobile touch/controller.
4. Unique project/creator artworks never overwritten by generic generated art; landscape environmental art stays clearly decorative.
5. Real information actions must be legible and reliable with the cinematic layer disabled entirely.

Visual palette: near-black navy void (#030916), structural alloy (#314760), optical cobalt (#12324b), photonic cyan (#88deff), secondary spectral violet (#ad8dff), sparing auric amber (#f0c98b). Detail treatment: directional machined glints, physically motivated rims, narrow light-line seams, soft luminous rims on earned sigils, controlled bloom. Text remains high contrast; text/icons must not be baked into artwork.

Visual priority:
- Arrival has the highest art budget (full exterior + intro).
- Discover/Archive balances a legible searchable catalogue against background architecture.
- Commons/Relay foregrounds readable people and conversations, not speculative connections.
- Creator/Identity Capsule foregrounds the real owner fields and verified claims.
- Studio/Forge foregrounds editor, file tree, authorized preview, statuses and operations.
- Observatory/Recognition/Supporter receives further sculpting only after real data and entitlements are available.

## 2. Technical composition

Existing runtime:
- React 19, React Router 7, Vite 8 and the existing Cloudflare static/frontend + immutable gateway packaging.
- \`Shell\` owns the common route surface, IREN dock, Wayfinder and ControllerBridge.
- \`LivingWorldProvider\` owns five-minute-refresh, sanitized public aggregate values, scene selection and pause state.
- \`LivingWorldField\` mounts one lazily loaded \`InstituteRendererV136\` WebGL2 canvas with three.js r0.180, PBR, Meshopt, native KTX and fallback vector.
- Four GLB families: Atrium / Archive / Forge / Relay. No duplicate canvas, R3F root, private user signals or GPU authorization.
- V136 visual foundation is build-time gated by \`VITE_PARITY_V136_FULL\`.

New runtime pilot:
- \`CinematicArrivalV136.tsx\` mounts once in the existing Arrival hero, *behind actual controls*.
- \`VITE_PARITY_V136_CINEMATIC=true\` is an additional explicit build-time opt-in. Default off (including existing production release packaging).
- The pilot uses the already-provenanced 1672px desktop / 768px mobile first-party PARITY V136 static artwork. It makes no claim to native 4K or complete concept fidelity.
- \`cinematic-director-v136.ts\` provides deterministic, testable mode/scroll/reveal functions. Passive scroll and resize listeners schedule one rAF; no scroll locks, route interception, direct DOM focus changes, session storage or telemetry.
- The image is pointer-inert, aria-hidden, same-origin, hashed in the immutable manifest and layered over the existing atmosphere. Reduced motion / Save-Data / user pause retains a static poster. Forced colors hides the poster. Failed poster yields to the canonical WebGL/vector scene.
- Scroll progress yields a bounded crossfade; source camera matching is not yet implemented, so this is deliberately a *fade*, not a falsely labeled seamless cinematic camera handoff.
- \`manifest.json\` keeps source and original hashes, device variants, animation approval state and handoff family/thresholds.
- No autoplay video or WebCodecs/remote generator is introduced by this slice. Original production CSP is still strict: HTML script 'self' and image 'self' but no new video-media permission; future video support requires a reviewed CSP and gateway change outside this frontend-only lane.

Future manifest extension (DESIGN, NOT IMPLEMENTED):
\`\`\`ts
type CinematicAssetManifest = {
  schema: 'anevum.cinematic.arrival.v1';
  source: string; provenance: {tool:string; license:string; origin:string};
  posters: Record<'mobile'|'desktop', {path:string;width:number;height:number;bytes:number;sha256:string}>;
  sequence: null | {
    approved:true; frameCount:number; frameDurationMs:number;
    mobile:{prefix:string;format:'webp'|'avif';sha256:string[]};
    desktop:{prefix:string;format:'webp'|'avif';sha256:string[]};
    cameraId:string; worldAssetVersion:string;
  };
  handoff:{sceneSector:'hero';geometry:'atrium';cameraId:string;revealStart:number;revealEnd:number};
};
\`\`\`
Asset manifest is typed in code before enabling non-null sequences; all URLs local and hash verified. Never treat the notional schema as currently supported by the pilot component.

## 3. Cinema-to-WebGL handoff: exact design

Creative beat 0 — Still Arrival: open on a sharp exterior wide shot of the Institute, floating platforms and a celestial body, with text left and sculpted IREN to the right (desktop); mobile crops upward without concealing the real CTA.

Beat 1 — Orientation: light ribbons and fog move very subtly *inside prerendered authored media* (when approved). Hero controls are immediately usable. No compulsory splash screen, forced play or content hidden until a film ends.

Beat 2 — Crossing: on user scroll or explicit real Discover navigation, a short camera/directional wipe reveals the existing Atrium/Archive WebGL scene. The route and focus change only through canonical React links and inputs. If cinema is unapproved or broken, direct navigational actions still work.

Beat 3 — Enter the Institute: moving to Discover selects Archive, Community selects Relay, Creator Studio selects Forge through existing SceneDirector profiles. Client-side navigation must not reset the single persistent renderer or overwrite search state.

Beat 4 — Return/continuance: existing real catalogue/identity data changes bounded environmental density and content placement, but never fabricates active users or real-time telemetry.

Camera matching acceptance for a genuinely seamless handoff (FUTURE):
1. Author Blender scene/camera version for the exterior and a corresponding runtime Atrium camera position/FOV.
2. Bake a motion sequence from exactly that controlled camera trajectory, preserving a common landmark and horizon line.
3. Export low-cost GLB/WebGL scene elements from the same source coordinates; update SceneDirector camera anchors with verified coordinates.
4. Confirm pixel alignment at the handoff frame with a before/after viewport capture and overlay difference map. Distinguish artistic match from measurable geometric match.
5. Switch from matte/crossfade to a targeted depth/light mask only after camera registration passes. If user scrolls or navigates unexpectedly, cancel the film gracefully and maintain DOM input.

## 4. Production pipeline: owned, reproducible, opt-in

**A. Spatial art bible.** From governing 1536×1024 boards, extract the allowed architecture and material lexicon into four source-worlds. The visual rule is continuity of place, not a new random image on every route. Define silhouettes, low/medium/high LOD, topology, atlas materials, camera rigs, bloom thresholds and screen-space text safe zones.

**B. Source imagery.** Produce art-directed concept/paintovers as references (existing ImageGen is acceptable for first-party design) and/or Blender 4.x scene files. A single high-resolution 4K-or-greater *actual native render* may drive derived screen variants; never upscale a 1672px image and call it native 4K. No control labels, numbers, names, buttons or fake creator screenshots baked into media.

**C. 3D.** Sculpt real architecture in Blender, with UVs, texture atlases and predictable HDR/lighting. Bake emission, ambient occlusion, surface roughness/normal detail where appropriate. Optimize deliverable variants using existing glTF-Transform + Meshopt and existing KTX work. Build on V136 GLBs rather than throwing them away. Use scenery/foreground matte layers only where genuine 3D interaction is unnecessary.

**D. Motion.** A camera-approved Blender-rendered film is preferred for seamless handoff. AI image-to-video can create atmospheric inserts when the source cannot be shared exactly with WebGL, but never call those segments camera-matched without evidence. Offline FFmpeg may convert authored frames into WebP/AVIF; do not install runtime video services or remote inference into the ANEVUM website. Pin encoder settings and record tool versions.

**E. Packaging.** Two responsive poster variants; optional mobile and desktop scroll-frame variants with separately hashed frame lists. Frame count capped and decoded frame cache bounded. Offline preflight audits native dimensions, assets, missing sequences, rights/provenance, transfer size, MIME, duplicate frames and dangerous paths. Same-origin immutable static hosting; avoid heavy motion on Save-Data and reduced motion.

**F. Integration.** Conditional cinematic module in public Shell/Arrival, no new app state ownership, no independent WebGL. Keep IREN, Wayfinder, gamepad navigation, search and account access in DOM. The GPU remains decorative and never executes creator packages. Any sandbox preview keeps existing isolated player rules.

**G. Visual QA.** Capture desktop at 1536×1024/DPR 1 alongside 1920, 1440, 1024, 768, 390, 320; compare actual page against governing boards. Use per-region human review and visual checkpoints: macro composition, materials, typography, spacing, project/identity state, responsiveness, navigation; screenshots alone do not prove functionality.

## 5. Targeted next surfaces after Arrival

| Surface | Art-directed scene | Real interface | Dynamic signal | Gate |
|---|---|---|---|---|
| Arrival | Institute exterior, docking arc, starfield | Discover/Join/IREN/Wayfinder | verified public catalogue count only | camera/art parity |
| Discover | Archive perspective stacks and search instruments | query, filters, public cards, Artifact Lens | approved public works/categories | search focus and catalogue regression |
| Commons | Relay towers, signal atrium | discussion feed, author capsules, posts, moderation | public content links only | no inferred relationships |
| Creators | Identity Constellation, capsule visual shell | real profile data, verified roles, public catalogue | verified member fields only | account isolation |
| Studio | Forge workstation behind source editor | file tree, Monaco, native ZIP, inspector, authenticated preview | authorized session-bound project data *in DOM only* | no unsafe source execution/publish |
| Observatory | Intentionally deferred until actual data validated | semantic metrics and reports | evidence-labeled aggregates | no synthetic metrics |
| Recognition | Signed/verified sigils and 3D keepsakes | verified entitlement and accessible details | earned status only | server eligibility |
| Supporter | Optical tier instruments and authentic storefront | provider-owned payment controls | actual offerings | payment contract unchanged |

## 6. UI asset rules

The original concepts mix UI and scene in a single painted board; reproducing that board as a PNG is prohibited as a functional website. Decompose them:
- Background scene: WebGL world or optimized authored media, with real depth and credible perspective.
- Foreground composition: responsive semantic DOM for actual text, interactions and forms.
- UI plates: CSS/SVG shapes with a deliberately limited optical material system, not 20 unrelated gradients.
- Sigils and badges: multi-resolution transparent raster/PBR assets only when genuine ownership is verified; no fictional member metrics.
- Project covers: original public creator artwork first, category illustration only if no real cover exists, explicitly labeled.
- Profiles: compact, legible canonical identity. Personalization may tint/decorate, not rewrite entitlements.
- Mobile: prioritize CTA/search/cards and thumb-sized nav; avoid copying a desktop three-column dashboard into a phone.

## 7. Milestones and dependencies

V136.013 / THIS SOURCE SLICE — Foundation.
- [x] Work on one new branch off the exact PR #728 checkpoint SHA; no forced merge.
- [x] Original poster source and integrity manifest, no new media purchases.
- [x] Gated React image/composite layer in actual Arrival.
- [x] Deterministic scroll/reveal logic respecting motion and fallback preferences.
- [x] Node asset integrity and mode/unit invariants; compiled-browser acceptance hooks.
- [ ] Exact-head CI and screenshot visual QA; real Safari/mobile review remains unclaimed.
- [ ] Draft PR review and upstream reconciliation; no production traffic.

V136.014 / Authored Institute scene + master asset quality.
- Four paintovers, one coherent master Atrium Blender scene, actual source-controlled native render, cropped responsive art, rights/provenance manifest.
- Artist acceptance: floating citadel complexity, atmosphere, foreground silhouettes, practical light sources, no art-board-only glyphs.
- Benchmark static LCP/CLS; reject if worse than existing release without visually justified gain.

V136.015 / Registered interactive camera handoff.
- Coordinate camera for final exterior clip to the existing InstituteRenderer and SceneDirector.
- Add bounded 24–48-frame sequence only if transfers/decoded memory justify it; optional modern video requires separate CSP review.
- Bypass cinema on keyboard focus/scroll reduction, low-data/low-power devices and user pause. Do not force autoplay.
- Verify clip-to-runtime landmark alignment, no renderer double mount, route interruption/cancellation.

V136.016 / Art-directed UI material system.
- Refactor scoped optical plates, PBR sigils, detailed icons, high-quality nav states and responsive layout.
- Remove conflicting repeated historical CSS overrides only on the explicitly owned V136 public surfaces; no broad legacy stripping.

V136.017 / Discover/Archive + Commons/Relay.
- Per-family authoring, real projects and discussions always in semantic DOM.
- Confirm search input state, filters, back/forward, public links, moderation and guest experience.

V136.018 / Studio/Forge and Identity Capsules.
- Real editor/preview/file tree as in #727; new details only with real asset and authorization.
- Profile/recognition motion driven by verified public fields/entitlements; no fake badges.

V136.019 / End-to-end quality and release.
- Visual reference review desktop/mobile, physical Safari and Xbox Edge/gamepad, actual-account isolation, GPU/context-loss soak, accessible keyboard/screen-reader, Core Web Vitals.
- Only after verified provider readbacks and cross-version asset pairing can traffic be incremented under rollback. A draft PR, CI pass, zero-traffic uploaded version and public allocation are separate events.

## 8. Non-negotiable measurable gates (targets until actually observed)

- Existing 1672px pilot desktop poster verified at 316,454 bytes; mobile 768px at 89,948 bytes. New static hero target desktop < 450 KB and mobile < 180 KB for the first art load where practical.
- Future nonessential movement frame assets load after first usable interaction, with bounded memory. Never preload hundreds of decoded large frames; 1080p RGBA is ~8.3 MB per decoded frame.
- Design for LCP <=2.5 seconds (representative mobile lab), CLS <=0.1, INP <=200 ms; measure representative field/physical devices before claiming.
- Only existing renderer may own the WebGL context; current capped budgets and verified absence of errors/lost-context recovery remain mandatory.
- No blocked CTA on <=390px screens; 44px minimum interactive targets. No forced animation; keyboard, screen reader, controller and touch reach the exact same real control.
- CSP unchanged in V136.013: same-origin images, existing script/worker rules; video not activated.
- No new private API input, attribution of ambient particles to unknown users, fake projects/followers/payment metrics, or unapproved publish action.
- Every visual asset recorded with source, actual native dimension, digest, rights/provenance and explicit file size.

## 9. Release and conflict management

PR #727 currently consolidates #725/#726 and must remain the authoritative WebGL/Studio history.
PR #728 is a *separate draft* stack for gamepad input on top of #727.
This V136.013 branch starts from PR #728 exact known head (3a313fb151551261b66410c507d8c57c19c69688) to preserve those changes; its review PR targets the #728 branch initially. Rebase/synchronize only through verified, explicit reconciliation if #728 moves.

Protected release helper source allowlist updated only for new frontend/QA/docs paths. Existing gateway bytes, 26 binding signature guard, 40 route ownership and shared baseline asset pairing remain unchanged. The feature flag is on only in **spatial QA**, not in the standard release workflow; therefore a build passing this branch does not turn the cinematic hero on in production.

As of the last verified production record, V136.003 had 99% and V136.005 had 1%. Live public readbacks from the execution environment previously hit Cloudflare 403/1010; do not weaken WAF rules for verification. Require provider-confirmed live allocation and both hashed-asset paths before any promotion.

## 10. Immediate verification sequence

1. Node v22 source: \`node creator-v1/graphics/inspect-cinematic-v136.mjs\`.
2. \`node --experimental-strip-types --test creator-v1/test/parity-v136-cinematic.test.mjs\`.
3. Fresh install/reuse project lock according to existing CI; \`npm run check:creator-v1-web\`.
4. \`VITE_PARITY_V136_FULL=true VITE_PARITY_V136_CINEMATIC=true npm run build:creator-v1-web\`.
5. Compiled Chromium QA (existing script) captures 7 responsive widths and checks poster load, pointer/ARIA safety, native fade and real Discover navigation; run existing V136 scene shader/3D smoke, controller, Studio, privacy and production package tests unchanged.
6. Human compare actual screenshots with all four governing boards. Do not declare full cinematic fidelity from the pilot; art master and camera parity are future work.
7. Inspect exact-head CI, reconcile any controller/Studio branch movement, and maintain draft until source and visual evidence pass.

## 11. Decisions not to reopen without material new evidence

- Do not rebuild site using Draftly. Treat its cinematic authoring model as reference and own the assets.
- Do not use video for every screen. Use the lightest effect appropriate to its purpose.
- Do not replace verified creator content with generated presentation.
- Do not add another animation state manager where DOM focus, SceneDirector and browser scroll already provide the necessary signals.
- Do not use photoreal concept images to conceal half-working publishing, payment or IREN operations.
- Do not claim motion, 4K, user analytics or completion from a proof-of-concept screenshot.

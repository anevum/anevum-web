# PARITY V136.014 — CINEMATIC PRODUCTION FOUNDATION

Session: ANEVUM.WEB.BUILD.2026-10-24.004.CINEMATIC-ASSET-PIPELINE
Date: 2026-10-24
Repository: anevum/anevum-web
Branch: build/parity-v136-cinematic-production-20261024-014
Upstream: PR #727 consolidated renderer/Studio; PR #728 gamepad; PR #729 cinematic poster/director.
Status: DRAFT SOURCE and ORIGINAL RENDER CANDIDATE. No production traffic or approved cinema master.

## Mission

Build an owned Blender/FFmpeg asset-production system and optional efficient media playback on top of our already-working React / single Three.js WebGL2 Continuance Institute. This is not a marketing still or a competing GPU renderer.

## Authored source delivered

1. creator-v1/graphics/author-cinematic-institute-v136.py — Original Blender source generator, procedural sculpted floating platforms, observational towers, illuminated transit bridges, armillary structure, space backdrop, materialized metal/basalt/auric/photonic surfaces and a camera path. It exports an editable .blend file, camera metadata, and native-frame PNG renders. First MASTER DESIGN PASS, not a finished painted AAA governing board match. Preview 960×540 and optional actual master 3072×1728, both honestly labeled.
2. creator-v1/graphics/encode-cinematic-v136.mjs — Offline FFmpeg pipeline from contiguous source PNG frames to desktop/mobile posters, 1536×864 / 768×432 WebP image sequences and optional MP4/H.264 and WebM/VP9 loops. Native output resolution never implies native source resolution. All generated files have byte counts and SHA256 hashes; output is always UNREVIEWED_NOT_FOR_PRODUCTION.
3. creator-v1/graphics/inspect-cinematic-candidate-v136.mjs — Independent input/output audit: source camera, codec, dimensions, frame ordering, path traversal, content digests and transfer caps. Cannot approve or deploy.
4. creator-v1/graphics/smoke-cinematic-v136.mjs — Real-media CI smoke with locally generated synthetic frames. Synthetic footage never appears as a public ANEVUM world.
5. creator-v1/web/src/parity/CinematicMediaContractV136.ts — Runtime approval gate: local same-origin paths, explicit approved:true, SHA256 metadata, 4–180 frames, 6–30 FPS, desktop <=8.5 MB, mobile <=3.8 MB, video <=12 MB and explicit media-src self requirement.
6. creator-v1/web/src/parity/CinematicFramesV136.tsx — Bounded DOM image player with a decoded Image cache of at most three references; existing router/scroll director and the persistent GPU context remain unchanged.
7. creator-v1/web/src/parity/CinematicVideoV136.tsx — Native muted video loop with preload none, offscreen/tab pause and failure fallback. Activation requires review-approved manifest PLUS VITE_PARITY_V136_NATIVE_VIDEO=true PLUS independently verified Cloudflare CSP media-src self. Production has none of those conditions today.
8. creator-v1/web/src/parity/CinematicArrivalV136.tsx — Real integration into existing Arrival. Current manifest contains no approved sequence/video, so the first-party poster remains the only presentation layer. No duplicate canvas, IREN, gamepad routing or account state.
9. .github/workflows/parity-v136-cinematic-production.yml — Pull-request CI creates 4 frames of genuine original Blender geometry, encodes candidate assets and uploads review artifacts. Separate source job exercises actual FFmpeg codecs and runtime security tests. No deploy/push permissions.

## Reproduce locally

Prerequisites: Blender with Cycles (3.6+), FFmpeg+FFprobe with libwebp/libx264/libvpx-vp9, Node 22. No AI inference service or runtime GPU hosting.

    blender --background --python creator-v1/graphics/author-cinematic-institute-v136.py -- --out /tmp/anevum-frames --quality preview --frames 8
    node creator-v1/graphics/encode-cinematic-v136.mjs --frames /tmp/anevum-frames --out /tmp/anevum-encoded --fps 12
    node creator-v1/graphics/inspect-cinematic-candidate-v136.mjs --candidate /tmp/anevum-encoded
    node --experimental-strip-types --test creator-v1/test/parity-v136-media-contract.test.mjs
    node creator-v1/graphics/smoke-cinematic-v136.mjs

For actual 3072×1728 master source, use --quality master --frames 48 and --fps 24 at the encoder; this costs CPU render time but not visitors' GPU inference costs. A 4-frame 960×540 CI preview must never be marketed as native 4K.

## Non-negotiable approval process

- Original art must be visual-reviewed against four 1536×1024 PARITY V136 concept boards. Assess silhouette, details, volumetric illumination, UI-safe negative space, responsive crop, ambient readability and motion. Check asset provenance and rights.
- Promote only deterministic hash-verified copies into immutable assets/cinematic-v136 URLs with a reviewed camera ID; raw CI output manifests are intentionally unapproved.
- First activate approved WebP frame sequences under existing script-src/img-src CSP. Native video is a separate security change; V131 sealed gateway and Cloudflare WAF cannot be silently modified or bypassed.
- Register actual Blender camera coordinates/FOV with Three.js SceneDirector before describing the media-to-WebGL fade as seamless; current V136.013 is only a composited fade.
- Recheck real iPhone Safari, Xbox Edge/gamepad, 1536×1024 concept view and 1920/1440/1024/768/390/320. Confirm search focus, primary CTA, IREN, no duplicates, account isolation, reduced motion, Save-Data, forced colors and WebGL context loss.
- Bounds are production transfer constraints, not claims about device decoded memory. Test LCP <=2.5s, CLS <=0.1, INP <=200ms on representative devices; these are targets until measured.

## Release boundaries

Only front-end source, offline render/encode/verification tools, protected release allowlist, tests and CI workflows change. No changes to existing gateway, D1/R2, authentication, permissions, moderation, financial data, XP/rewards, upload rights, live content records, payments or production traffic. Continue the #727 -> #728 -> #729 -> V136.014 branch lineage and reconcile before merging. Current cinematic flag stays OFF in normal release workflows. Prior Cloudflare observed V136.003 99% / V136.005 1% is not automatically fresh provider evidence.

## What remains

- Complete authored Blender preview render, visually inspect artifact, improve model geometry/materials.
- Produce a reviewed 3072 native master and camera-compatible WebGL export.
- Build a reviewed candidate importer and activate a genuinely approved 24–48-frame asset sequence in an isolated QA candidate.
- Independently review CSP media-src self before any actual public video.
- Expand the same unified spatial language to Archive, Relay, Forge, profiles, Observatory and Studio only after the Arrival is visually convincing and all real actions work.

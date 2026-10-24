# ANEVUM PARITY V136.015 — CAMERA AND GEOMETRY REGISTRATION

Session: ANEVUM.WEB.BUILD.2026-10-24.005.REGISTERED-CINEMATIC-HANDOFF
Date: 2026-10-24
Repository: anevum/anevum-web
Branch: build/parity-v136-cinematic-camera-20261024-015
Stack: #727 consolidated WebGL/Studio -> #728 controller -> #729 cinematic pilot -> #730 Blender/FFmpeg production -> this increment.

Status: DRAFT SOURCE + OFFLINE ARTIFACT REGISTRATION, NOT PRODUCTION CAMERA-MATCHED CINEMA.

## Architectural finding

The native Blender v136.014 authored flying Institute and the existing Three.js v136-011 Atrium are **different meshes with different scene coordinates, lighting and camera trajectories**. A file-format conversion cannot make two differently sculpted worlds visually identical. No existing prebuilt camera can be correctly interpolated to the new cinematic shot until the SAME geometry is loaded on both sides.

V136.015 separates two tasks:
1. Export an editable, annotated Blender camera AND the exact shared authored GLB so camera and geometry have common source coordinates, allowing mathematical registration.
2. Gate the runtime poster-to-WebGL transition on actual scene availability, preserving the accessible vector scene if WebGL/GLB is absent. Do not claim a seamless matched camera in this increment.

## Implemented, independently testable

- `creator-v1/graphics/author-cinematic-institute-v136.py`: full camera world-space pose at each numbered frame, forward/up vectors, true lens-derived vertical/horizontal FOV, world revision, named landmarks. Exports a review-only GLB from the exact same Blender mesh source as the rendered frames, excluding camera-attached matte and atmospheric dust. Records immutable SHA256, encoded byte size and source mesh count. The generated .blend remains editable with artwork packed.
- `creator-v1/web/src/parity/CinematicCameraRegistrationV136.ts`: pure Blender Z-up to glTF/Three Y-up vector rotation, sample validation, normalized direction vectors, basis-and-scale landmark fitting, maximum and RMS residual calculation, camera orientation transformed through the same coordinate fit, and a hard eligibility predicate requiring **all** of same shared-world revision, approved media, geometry residuals, pixel-level visual QA and controller-safe route handling. No network, session access, new renderer or mutable global state.
- `creator-v1/graphics/inspect-cinematic-camera-v136.mjs`: reads actual locally rendered source camera manifest, review GLB, independently checks container version/digests, named landmark correspondence, per-frame camera geometry and unchanged candidate approval state. It explicitly fails if review artifacts pretend to match the currently shipped v136-011 scene or are accidentally approved for runtime.
- `creator-v1/test/parity-v136-camera-registration.test.mjs`: basis conversion, camera input sanity, noncollinear anchors, mathematical residual verification, perturbation rejection, separate creative-review gate, and poster hold/reveal rules.
- `creator-v1/web/src/parity/cinematic-director-v136.ts`: clear differentiation of actual ready WebGL geometry, fallback vector/shader, and still-loading scene; only a ready visual surface permits reveal.
- `creator-v1/web/src/parity/CinematicArrivalV136.tsx`: a narrow MutationObserver watches the **already existing** global scene's renderer/asset status. It holds the poster while WebGL models load, crossfades after status becomes ready, permits vector fallback, and avoids flashing back to the poster after a handoff has committed. No second canvas or Router mutation; no private data.
- Existing compiled browser QA probes a deliberately simulated GPU-loading state, then a ready state. This tests reveal timing only; separate GLB render QA tests real pixels.

## Source provenance and truthful status

Shared source GLB and camera sample metadata are produced by the PR CI's Blender renderer. They are **review artifacts**, not a new public glTF asset or new production camera rig. The new GLB has larger and denser original sculpting than the existing v136-011 asset; performance and memory eligibility are NOT proven by camera math. Review scene is explicitly `approvedForRuntime:false` and `geometryMatchToLiveV136011:false`.

The live runtime continues to use the existing v136-011 Atrium GLB, existing `SceneDirectorV136` routes, original normalized aggregates and single WebGL renderer. Original first-party 1672px artwork poster remains opt-in; approved video and frame sequence remain null. Neither native video CSP nor production allocations change.

## Camera handoff acceptance / next actual implementation stage

1. Render actual source/master artwork at native usable resolution, art-direct the foreground and compare to governing V136 boards.
2. Convert and optimize the new shared GLB using the already-pinned glTF-Transform, Meshopt, KTX workflow; create separate mobile/desktop budgets and viewport-specific material variants. Do **not** replace source files or declare 60 FPS on the basis of this exporter.
3. Register the new shared GLB in a staging-only parallel version of the InstituteAssetManifest; then capture actual WebGL and final authored frame at the same camera coordinate, FOV and screen aspect ratio.
4. Measure reprojection and image-difference error on actual screenshots. Record bounding boxes/landmarks in screen coordinates; gate actual source change, camera handoff and opacity mask behind a QA-approved manifest. Reject if geometric residual, image-match quality, GPU budgets or device testing fail. Current screenshot results do not prove this yet.
5. Activate a short, approved 24–48 frame WebP sequence in staging under the existing image-src policy. Optional native video still requires reviewed media-src 'self' changes plus same-version Cloudflare delivery verification.
6. Physically test Safari/iPhone and Xbox Edge gamepad navigation, reduced motion, Save-Data, keyboard, IREN, Studio/account isolation and route interrupts. No second renderer, fabricated user activity or forced video intro.

## Verification and release

CI runs the original Blender preview/GLB export, FFmpeg proof, candidate integrity checks, camera/landmark validation, Node math tests, full V136 source/React/browser checks, and existing protected release checks. All outputs are uploaded to reviewer artifacts only. PR remains draft unless CI and visual review pass; even a passing CI does not authorize runtime asset promotion or public traffic changes. The V136.014 standard release cinematic flag and native-video flag remain OFF.

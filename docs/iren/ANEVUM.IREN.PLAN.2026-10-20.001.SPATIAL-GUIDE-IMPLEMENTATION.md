# IREN Spatial Guide — Implementation Plan

Session: ANEVUM.IREN.DESIGN.2026-10-20.001.SPATIAL-GUIDE-ONBOARDING
Status: approved design direction, NOT implemented or deployed.
Do not alter the frozen V095/V096 immutable Cloudflare candidate.

## Existing source to preserve
- creator-v1/web/src/components/IrenGuidedContinuance.tsx: canonical member/guest step flows, selectors, first-contact, route handling, notifications, tour storage.
- creator-v1/web/src/components/IrenLivingCanvas.tsx and lib/iren-living-rig-v088.ts: canonical WebGL companion, articulated gestures and SVG fallback.
- creator-v1/web/src/lib/iren-companion-context-v089.ts: deterministic station help.
- creator-v1/web/src/iren-guided-v080.css and iren-living-v088.css: mobile bottom-card and guide embedding causing blocked target.
- creator-v1/test/iren-guided-v080.test.mjs, iren-living-v088.test.mjs, iren-first-contact-v092.test.mjs: existing regression contracts.

## Slice A: solve the actual screenshot problem
1. Branch from the latest accepted application source after release work. Add default-OFF VITE_IREN_SPATIAL_GUIDE flag; preserve legacy rendering as rollback, not a second companion.
2. Extract tour-state and anchor measurement without changing seven member lessons, three visitor lessons, existing event names or persisted keys.
3. Render compact tethered bubble and a single free-floating mounted IrenLivingCanvas. Remove click-catching shade, aria-modal and tab focus trap in flag-ON mode only.
4. Attach a non-intercepting halo to the actual anchor. Real controls must be tappable during tour. Click on highlighted control pauses the tour without swallowing the click.
5. Implement pure placement scoring: target collision, bubble/character dimensions, visualViewport offset and size, safe-area insets, fixed navigation, keyboard and header, and scroll. Prioritize beside/above/below placements, then compact edge fallback. Never use the tall bottom card on phones.
6. Use ResizeObserver plus frame-coalesced measurement; cancel travel when route, viewport or target changes. If target absent, give a truthful small fallback, not a fake spotlight.
7. Connect existing travel/guide moods, tracked gaze and pointing to target center. Preserve rest, paused animation, WebGL context loss and SVG fallback.
8. Use short sentence and Back/Next/Skip, accessible tap targets, optional More, one progress label. No automatic focus theft or modal keyboard trap.

## Slice B: polish first contact and living behavior
1. Replace the four-choice introductory panel with a tiny spontaneous bubble: Show me / Not now / More choices. More choices reveals the existing routes; no new API.
2. Retain visible/non-editing/dialog deference, first-contact local preference, member-created trigger and per-account pause/skip state. Never repeat an already dismissed greeting.
3. Choreograph arrive, face target, point, then bubble; one active transition, ~450-750ms travel, and no moving text during reading. Reduced motion means immediate placement.
4. Preserve Signal notifications and server-earned rewards; celebrate only genuinely new achievements. No LLM impersonation, synthetic XP, private guest data, new model spend or staff grants.
5. Avoid unsolicited help while typing, uploading, playing, reviewing, or navigating critical controls.

## Implementation module suggestion
- Keep IrenGuidedContinuance as one public entrypoint, with flag-conditional presentation.
- Add IrenSpatialTour.tsx and iren-spatial.css as presentation modules.
- Add iren-placement.ts for pure geometry and use-iren-anchor.ts for measured targets, scoped to the existing component.
- Adapt old tests for both feature flag states; never delete safety expectations merely to green-light CI.

## Exact release tests
- Pure geometry: 320/390/768/1440 widths, full-width cards, top header, bottom bar, Safari visual viewport shifting, keyboard, 200% zoom, scroll reflow, absent targets, safe-area cutouts.
- Browser: actual content visible, target tappable, no shade intercepting input, no horizontal overflow, no duplicate companion, frame-safe repositioning, no input focus theft.
- A11y: page remains tabbable, Escape pauses, live step spoken once, controls operable in VoiceOver, forced-colors and prefers-reduced-motion.
- Rendering: real WebGL gesture, rig setLook points toward target, context-loss SVG fallback, pause and rest CPU budgets.
- Identity: Observer 001 ordinary-member tour, guest three steps, founder and distinct reviewer; ensure no role, XP or hidden specimen disclosure.
- Actual iPhone Safari: portrait/landscape, dynamic bars, real gestures and collisions, tapping highlighted controls, skip/resume and refresh, mobile keyboard.
- Full existing CI matrix and isolated responsive captures at exact source SHA.

## Release discipline
Development starts in isolated review only. Keep current V095/V096 candidate at 0%, production at prior 100% until its existing acceptance completes. Source-changing IREN work needs its own reviewed candidate, independent signed-in account QA and actual iPhone signoff, source/asset locks, rollback and separate owner approval. No schema changes, Cloudflare route changes, production deployment or operational flags are authorized by this design document.

Acceptance: IREN moves beside at least three distinct real anchors on iPhone, points at them, speaks via a compact bubble, and never covers the described UI; all privacy, notification, onboarding progress and keyboard guarantees survive.
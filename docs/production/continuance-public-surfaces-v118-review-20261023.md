# Continuance V118 — Shared Public Workspace Surfaces

Session: `ANEVUM.WEB.BUILD.2026-10-23.002.PUBLIC-SURFACES-V118`

**Status:** Source implementation and offline acceptance candidate. Not approved for
merge, production deployment, live feature activation or authenticated member
testing.

## Design decision

The V115/V116 discovery-first entrance and IREN work already exist in the
approved release source. V117 adds accessible first-member guidance; parallel
V123 draft #665 also changes the same homepage, join and IREN files. They must
be reconciled rather than independently merged without diff review.

V118 intentionally avoids those shared files. It establishes a compact
shared **Continuance Workspace** context on the canonical public Discover and
Community routes. Creator Studio remains a link to the existing actual route,
not a promise of publishing access. IREN remains a single Shell-owned guide,
not another assistant.

## Implemented components

- `creator-v1/web/src/components/ContinuanceWorkspaceSwitchV118.tsx`
  renders a typed public location switcher for Discover, Community and Creator
  Studio. The active page is programmatically marked `aria-current="page"`.
  The help button dispatches the already supported `anevum:iren-open` event.
- `creator-v1/web/src/continuance-public-surfaces-v118.css`
  defines scoped design tokens for high-contrast ink, quiet surfaces,
  accessible borders and focus, surface elevations and touch targets.
  No image download, custom font, WebGL, motion runtime, external library
  or DOM manipulation is added.
- `DiscoverPage.tsx` mounts the shared switcher **after the public catalogue** as a next-stop
  orientation surface. This preserves the verified search, filters and first
  results within the phone first fold, leaving category filtering, free-only
  declarations, actual project results and empty states unchanged.
- `CommunityPage.tsx` mounts the same switcher beneath the existing community
  hero; public creators, moderated discussions, genuine counts and navigation
  remain unchanged.
- The cosmetic `av118-surface` class aligns Discover's search hall and
  Community's verified counts with the shared surface treatment.

## Functional limits

- Existing React and CSS only; no framework migration or new npm dependencies.
- No account state, user tracking, private data lookup, login/OTP changes,
  uploads, payments, reward changes or production configuration.
- No fabricated public works, registrations, traction or creator claims.
- Existing global navigation stays unchanged; this is contextual in-page
  orientation and does not replace the Shell Wayfinder.
- Creator Studio source integration #658 and its D1 migration 0014 remain OFF
  and are not imported here.
- V117 draft #666 and V123 draft #665 overlap with each other, but not with
  this public page/context component update.

## Acceptance and evidence

Workflow: `.github/workflows/continuance-public-surfaces-v118-qa.yml`

1. TypeScript check and both root/staging-path Vite builds.
2. Source and regression tests for existing API reads, React routes, public
   empty/error states, URL-driven filters, accessible navigation and IREN.
3. Local compiled real-React browser acceptance on 1440, 390 and 320 pixel
   screens for Discover and Community; active-route semantics, touch targets,
   links, overflow, and the single IREN companion are checked.
4. Artifacts include full screenshots and a structured acceptance JSON.
5. Release review requires exact-head CI green, physical iPhone Safari
   spot checks and independent confirmation of protected deployment gates.

## Subsequent design phases

Unify typography, input, panel, badge, creator card and notification
presentations using route-safe tokens, then extend to Member Space and the
feature-flagged Creator Studio after the source and D1 release branches are
reconciled. Performance improvements should favor CSS and selective splitting
of oversized JS/CSS bundles before adding 3D or heavy animation libraries.

No deployment or database operation is triggered by this design PR.

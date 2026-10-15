# ANEVUM — Cinematic Site Overhaul V005

Session: ANEVUM.WEB.BUILD.2026-10-14.005.CINEMATIC-SITE-OVERHAUL
Owner reference: approved Oct 14 five-panel concept (cosmic portal homepage, content browser, playable project page, creator profile, XP/rewards). Concept is a design reference, not a live page, real member or published project.

## Source authority and scope
- Base: production/creator-v1 at 2bc898f7624753a486bce321f338e545b22545e8 (latest verified live release, including #386 discussions).
- Draft source: web/cinematic-world-v005-20261014. No automatic release/merge.
- Works in existing React 19 / TS / Vite Creator V1. No framework rewrite, route relocation, auth modification, D1 migration, API modifications, new external fonts, autoplay or paid dependency.
- Existing GitHub drafts #385/#387 are earlier visual explorations; do not merge their older App.tsx or homepage over current production.

## Approved experience contract
1. Core visual signature: high-detail illustrated cosmic portal environments, physically layered translucency, near-black/indigo/violet night palette, coral lighting, cyan actionable highlights, clear readable labels, authentic ANEVUM mark.
2. Desktop: one compact top header, persistent secondary rail, dramatic hero with orbit and centre wordmark, five actionable gateway cards, factual featured spotlight and genuine live catalogue. Browsing/projects/creators/community/levels share the same frame.
3. Phone: usable single-column content, real menu and account navigation, accessible touch targets; no scaled-down desktop screenshot or hidden content.
4. Project art: category art is explicitly not a creator-submitted cover. Project content and destinations come from approved live APIs. No fabricated plays, ratings, creators, chat, badge unlocks or genuine Evergrove release before authorization.
5. Creator identities, private drafts, publication and discussion moderation, member progression, protected Lab/RHEN, and outward launch remain bound to existing controls.
6. No client-only controls for login rights, moderation authority, publishing approval or progression awards.

## Route presentation matrix (V005)
- /: cinematic landing with a shared rail and refreshed portal composition.
- /discover, /projects/:id: real catalogue, safe Play/Try/Open actions and project passport.
- /creators, /creators/:handle: public directory and published creator channel.
- /community, /boards, /community/posts/:id: approved-only public board/read routes.
- /levels: artifact previews and server-grounded progression explanation.
- /start, /guide, /status, /workspace: framed informational and gateway pages.
- /create*, /account*, /library*, /community/write: remain behind existing MemberGate and preserve their existing layouts.
- /atlas*: unchanged separate experimental spatial interface; /portfolio/* unchanged.

## Design rollout (no unauthorised deploy)
- V005: shared rail/navigation, consistent page frame, hero layout, design tokens, responsive/reduced-motion support, pre-production tests.
- V006: dedicated art masters and delivery pipeline (per-scene layered 2K/4K originals converted to correctly sized AVIF/WebP; hero, category, project and profile templates); new actual art must be independently visually approved and licensed.
- V007: real creator supplied project covers, immersive detail viewer where safe, improved search/facets, same approved-only DTO source.
- V008: customizable member banners, creator channels and safe cosmetic rewards; owner moderation rights remain separate.
- V009: approved creator social features and native playback only after isolated origin/upload/moderation/privacy reviews.
- V010: hosted UI/e2e and accessibility/mobile/performance signoff, independent creator/staff/reviewer journey, rollback, production authorization.

## Hard acceptance
- TypeScript build and both Vite targets; public/member/staff/privacy tests.
- Check 1440, 1024, 390, 320 pixels: hero crop, menu, nav, full content, no horizontal page overflow, touch targets, reduced motion, 200% zoom, keyboard focus, missing image, real zero-catalogue and API failure states.
- Check /boards and project discussions remain linked; authenticated /community/write remains MemberGate-protected; no dummy metrics.
- Compare actual compiled captures against approved concept. Owner visual acceptance is separate from tests.
- No merger or Cloudflare Workers/D1 action until explicit review and independent release checks.
